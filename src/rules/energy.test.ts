import { describe, expect, it } from '@jest/globals';
import { cardNeed, countsToday, getEnergyBar, goalMetBefore, newlyScoredMetGoals } from './energy';
import { EVERY_DAY, getDailyResult, type CheckInLog, type Habit } from './scoring';

const sleep: Habit = {
  id: 'sleep',
  name: 'Sleep',
  goal: { kind: 'specificDays', days: EVERY_DAY },
  color: 'habit1',
};
const exercise: Habit = {
  id: 'exercise',
  name: 'Exercise',
  goal: { kind: 'anyDays', timesPerWeek: 3 },
  color: 'habit5',
};
// Run on Monday and Wednesday only (weekly goal 2).
const run: Habit = {
  id: 'run',
  name: 'Run',
  goal: { kind: 'specificDays', days: [0, 2] },
  color: 'habit2',
};

// Week of Sunday 2026-10-11. Thursday 10-15 is "today".
const SUN = '2026-10-11';
const MON = '2026-10-12';
const TUE = '2026-10-13';
const WED = '2026-10-14';
const THU = '2026-10-15';

/** Exercise done on `n` earlier days this week. */
function exerciseBefore(n: number): CheckInLog {
  const days = [SUN, MON, TUE].slice(0, n);
  return Object.fromEntries(days.map((d) => [d, { exercise: 'Started' as const }]));
}

describe('what counts toward the Energy bar', () => {
  it('an Any days habit counts until its weekly goal is met', () => {
    expect(countsToday(exercise, exerciseBefore(0), THU)).toBe(true);
    expect(countsToday(exercise, exerciseBefore(2), THU)).toBe(true);
    expect(countsToday(exercise, exerciseBefore(3), THU)).toBe(false);
    expect(goalMetBefore(exercise, exerciseBefore(3), THU)).toBe(true);
  });

  it('a Specific days habit counts on its planned days until met, and never on other days', () => {
    expect(countsToday(run, {}, MON)).toBe(true);
    expect(countsToday(run, {}, THU)).toBe(false);
    const met = { [MON]: { run: 'NailedIt' }, [TUE]: { run: 'Started' } } as CheckInLog;
    expect(countsToday(run, met, WED)).toBe(false);
  });
});

describe('getEnergyBar', () => {
  it('owed Exercise moves the bar the same amount as Sleep', () => {
    const sleepStar = getEnergyBar([sleep, exercise], { [THU]: { sleep: 'Started' } }, THU);
    const exStar = getEnergyBar([sleep, exercise], { [THU]: { exercise: 'Started' } }, THU);
    expect(sleepStar).toMatchObject({ earnedStars: 1, possibleStars: 6 });
    expect(exStar.fill).toBe(sleepStar.fill);
  });

  it('the tap that reaches the goal moves the bar', () => {
    const log = { ...exerciseBefore(2), [THU]: { exercise: 'NailedIt' } } as CheckInLog;
    expect(getEnergyBar([sleep, exercise], log, THU)).toMatchObject({
      earnedStars: 3,
      possibleStars: 6,
      fill: 0.5,
    });
  });

  it('once the goal is met earlier in the week, extra stars do not move the bar', () => {
    const before = exerciseBefore(3);
    const none = getEnergyBar([sleep, exercise], before, THU);
    const extra = getEnergyBar(
      [sleep, exercise],
      { ...before, [THU]: { exercise: 'NailedIt' } },
      THU,
    );
    expect(extra).toEqual(none);
    expect(none.possibleStars).toBe(3);
  });

  it('Skip takes a habit out of the bar', () => {
    const result = getEnergyBar(
      [sleep, exercise],
      { [THU]: { sleep: 'NailedIt', exercise: 'NotToday' } },
      THU,
    );
    expect(result).toMatchObject({ earnedStars: 3, possibleStars: 3, fill: 1 });
  });

  it('nothing counting is a Rest day on the bar: full, nothing to celebrate', () => {
    const result = getEnergyBar([sleep], { [THU]: { sleep: 'NotToday' } }, THU);
    expect(result).toEqual({ earnedStars: 0, possibleStars: 0, fill: 1, isRestDay: true });
  });

  it('owed Exercise keeps a no-due day from being a Rest day on the bar (the rank still calls it one)', () => {
    const bar = getEnergyBar([run, exercise], {}, THU);
    expect(bar).toMatchObject({ isRestDay: false, fill: 0, possibleStars: 3 });
    expect(getDailyResult([run, exercise], {}, THU).isRestDay).toBe(true);
  });
});

describe('the rank is unchanged', () => {
  it('optional Exercise still only raises the day for the rank', () => {
    const log = { [THU]: { sleep: 'NailedIt', exercise: 'Started' } } as CheckInLog;
    expect(getDailyResult([sleep, exercise], log, THU).score).toBe(1);
    // ...while the bar counts owed Exercise like any other habit.
    expect(getEnergyBar([sleep, exercise], log, THU).fill).toBeCloseTo(4 / 6);
  });
});

describe('card status and Weekly goal met', () => {
  it('an unscored card says To do, Goal met, or nothing', () => {
    expect(cardNeed(exercise, exerciseBefore(1), THU)).toBe('toDo');
    expect(cardNeed(exercise, exerciseBefore(3), THU)).toBe('goalMet');
    expect(cardNeed(run, {}, THU)).toBe('none');
  });

  it('plays for the tap that reaches the goal, and for the first tap after it was already met', () => {
    const twoBefore = exerciseBefore(2);
    const reach = { ...twoBefore, [THU]: { exercise: 'Started' } } as CheckInLog;
    expect(newlyScoredMetGoals([sleep, exercise], twoBefore, reach, THU).map((h) => h.id)).toEqual([
      'exercise',
    ]);
    const met = exerciseBefore(3);
    const extra = { ...met, [THU]: { exercise: 'Started' } } as CheckInLog;
    expect(newlyScoredMetGoals([exercise], met, extra, THU)).toHaveLength(1);
  });

  it('not for Skip, an untap, a tap that does not reach the goal, or an unchanged card', () => {
    const met = exerciseBefore(3);
    const skip = { ...met, [THU]: { exercise: 'NotToday' } } as CheckInLog;
    expect(newlyScoredMetGoals([exercise], met, skip, THU)).toHaveLength(0);
    expect(newlyScoredMetGoals([exercise], skip, met, THU)).toHaveLength(0);
    const one = exerciseBefore(1);
    const short = { ...one, [THU]: { exercise: 'NailedIt' } } as CheckInLog;
    expect(newlyScoredMetGoals([exercise], one, short, THU)).toHaveLength(0);
    expect(newlyScoredMetGoals([exercise], short, short, THU)).toHaveLength(0);
  });
});
