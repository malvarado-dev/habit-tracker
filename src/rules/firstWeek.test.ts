import { describe, expect, it } from '@jest/globals';
import { getEnergyBar } from './energy';
import { weekRows } from '@/features/history/historyModel';
import {
  EVERY_DAY,
  getWeekProgress,
  isDue,
  weekGoal,
  type CheckInLog,
  type Habit,
} from './scoring';

// Week of Sunday 2026-10-11 to Saturday 2026-10-17. Next week starts Sunday 2026-10-18.
const DAY = {
  sun: '2026-10-11',
  mon: '2026-10-12',
  tue: '2026-10-13',
  wed: '2026-10-14',
  thu: '2026-10-15',
  fri: '2026-10-16',
  sat: '2026-10-17',
};
const NEXT_SUN = '2026-10-18';

const everyDay = (addedOn?: string): Habit => ({
  id: 'sleep',
  name: 'Sleep',
  goal: { kind: 'specificDays', days: EVERY_DAY },
  color: 'habit1',
  addedOn,
});
// Monday, Wednesday, Friday (saved weekdays 0, 2, 4).
const mwf = (addedOn?: string): Habit => ({
  id: 'run',
  name: 'Run',
  goal: { kind: 'specificDays', days: [0, 2, 4] },
  color: 'habit2',
  addedOn,
});
const threeTimes = (addedOn?: string): Habit => ({
  id: 'exercise',
  name: 'Exercise',
  goal: { kind: 'anyDays', timesPerWeek: 3 },
  color: 'habit5',
  addedOn,
});

describe('first week goal (#52)', () => {
  it.each([
    ['sun', 7, 3, 3],
    ['mon', 6, 3, 3],
    ['tue', 5, 2, 3],
    ['wed', 4, 2, 2],
    ['thu', 3, 1, 2],
    ['fri', 2, 1, 1],
    ['sat', 1, 0, 1],
  ] as const)(
    'added %s: Every day %i, Mon/Wed/Fri %i, 3 times a week %i',
    (day, every, m, three) => {
      const added = DAY[day];
      expect(weekGoal(everyDay(added), added)).toBe(every);
      expect(weekGoal(mwf(added), added)).toBe(m);
      expect(weekGoal(threeTimes(added), added)).toBe(three);
    },
  );

  it('the full goal comes back the next Sunday', () => {
    expect(weekGoal(everyDay(DAY.fri), NEXT_SUN)).toBe(7);
    expect(weekGoal(threeTimes(DAY.fri), NEXT_SUN)).toBe(3);
  });

  it('habits with no added date (before this rule) keep their full goal', () => {
    expect(weekGoal(everyDay(), DAY.fri)).toBe(7);
    expect(weekGoal(threeTimes(), DAY.sat)).toBe(3);
  });

  it('added Saturday with no planned days left: not due until Sunday', () => {
    expect(isDue(mwf(DAY.sat), {}, DAY.sat)).toBe(false);
    expect(isDue(mwf(DAY.sat), {}, '2026-10-19')).toBe(true);
  });

  it('never due, and never counted, on days before it was added', () => {
    const habit = everyDay(DAY.thu);
    expect(isDue(habit, {}, DAY.wed)).toBe(false);
    const log: CheckInLog = { [DAY.wed]: { sleep: 'NailedIt' }, [DAY.thu]: { sleep: 'Started' } };
    expect(getWeekProgress(habit, log, DAY.thu)).toEqual({ done: 1, goal: 3 });
  });

  it('a Friday install can meet every goal that first week', () => {
    const habits = [everyDay(DAY.fri), threeTimes(DAY.fri)];
    const log: CheckInLog = {
      [DAY.fri]: { sleep: 'Started', exercise: 'Started' },
      [DAY.sat]: { sleep: 'Started' },
    };
    expect(getWeekProgress(habits[0]!, log, DAY.sat)).toEqual({ done: 2, goal: 2 });
    expect(getWeekProgress(habits[1]!, log, DAY.sat)).toEqual({ done: 1, goal: 1 });
    // Exercise met its 1 on Friday, so it no longer counts toward Saturday's Energy bar.
    expect(getEnergyBar(habits, log, DAY.sat).possibleStars).toBe(3);
    const rows = weekRows(habits, log, DAY.sat);
    expect(rows.map((r) => r.label)).toEqual(['2 of 2', '1 of 1']);
  });

  it('History has no row for a habit in weeks before it was added', () => {
    expect(weekRows([everyDay(NEXT_SUN)], {}, DAY.wed)).toEqual([]);
  });
});
