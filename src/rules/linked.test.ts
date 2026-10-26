// P2-08b: linked bad habits on a good habit's card, and Skip.
import { describe, expect, it } from '@jest/globals';

import { createInitialState, trackerReducer, type TrackerState } from '@/features/tracker/state';
import { getActivityBar } from './activityBar';
import type { BadHabit } from './badHabits';
import type { Habit } from './habits';
import { dayLogs, isSkipped, linkedBadHabit, withLinkedSlips } from './linked';
import { allHabits, barLog, historyDay } from './locking';
import { groupHabits } from './sheet';

const DAY = '2026-10-25';
const EVERY = [0, 1, 2, 3, 4, 5, 6] as const;
const eat: Habit = {
  id: 'eat',
  name: 'Eat Healthy',
  color: 'habit1',
  schedule: { kind: 'specificDays', days: [...EVERY] },
  timesPerDay: 3,
};
const read: Habit = { ...eat, id: 'read', name: 'Read', timesPerDay: undefined };
const eatOut: BadHabit = { id: 'eat-out', name: 'Eat Out', pairedWith: 'eat' };
const soda: BadHabit = { id: 'soda', name: 'Soda' };

const start = (): TrackerState => ({
  ...createInitialState(),
  habits: [eat, read],
  badHabits: [eatOut, soda],
});
const run = (state: TrackerState, ...actions: Parameters<typeof trackerReducer>[1][]) =>
  actions.reduce((s, a) => trackerReducer(s, a), state);
const logEat = { type: 'logHabit', date: DAY, habitId: 'eat' } as const;
const slipEatOut = { type: 'logSlip', date: DAY, badHabitId: 'eat-out' } as const;

describe('linked slips (PRD-15 Design 1)', () => {
  it('finds the bad habit paired with a good habit', () => {
    expect(linkedBadHabit(eat, [eatOut, soda])).toBe(eatOut);
    expect(linkedBadHabit(read, [eatOut, soda])).toBeUndefined();
  });

  it('gold logs come first in the count, linked slips (slate) after', () => {
    const state = run(start(), logEat, slipEatOut, slipEatOut);
    expect(dayLogs(eat, state.log, state.slips, state.badHabits, DAY)).toEqual({
      gold: 1,
      slate: 2,
      total: 3,
    });
  });

  it('1 gold + 2 slate finishes a 3-times habit, and the card leaves the list', () => {
    const state = run(start(), logEat, slipEatOut, slipEatOut);
    const { today } = groupHabits(state.habits, barLog(state), DAY, state.skips);
    expect(today.map((h) => h.id)).toEqual(['read']);
  });

  it('a finished habit takes no more gold logs or linked slips', () => {
    const done = run(start(), logEat, slipEatOut, slipEatOut);
    expect(run(done, logEat)).toBe(done);
    expect(run(done, slipEatOut)).toBe(done);
  });

  it('linked slips move the Activity Bar like gold logs; standalone slips never do', () => {
    const state = run(start(), slipEatOut, { type: 'logSlip', date: DAY, badHabitId: 'soda' });
    const bar = getActivityBar(allHabits(state), barLog(state), DAY);
    expect(bar.logs).toBe(1);
    expect(withLinkedSlips(state.habits, state.log, state.slips, state.badHabits)).toEqual({
      [DAY]: { eat: 1 },
    });
  });

  it('a day where linked slips fill the bar counts as a check-in', () => {
    // Eat (3, counted as 3) + Read (1) = 4 possible, full at 3.
    const state = run(start(), slipEatOut, slipEatOut, slipEatOut);
    expect(historyDay(state, DAY).outcome).toBe('checkIn');
  });
});

describe('Skip (decided 2026-10-25: hide the card, change nothing else)', () => {
  const skip = { type: 'skipHabit', date: DAY, habitId: 'read' } as const;

  it('hides the card for that day only', () => {
    const state = run(start(), skip);
    expect(isSkipped(state.skips, DAY, 'read')).toBe(true);
    expect(groupHabits(state.habits, state.log, DAY, state.skips).today.map((h) => h.id)).toEqual([
      'eat',
    ]);
    expect(groupHabits(state.habits, state.log, '2026-10-26', state.skips).today).toHaveLength(2);
  });

  it('never changes the Activity Bar target, so skipping can never make it easier', () => {
    const before = run(start(), { type: 'lockDays', today: DAY });
    const after = run(before, skip);
    expect(after.targets[DAY]).toBe(before.targets[DAY]);
    const bar = (s: TrackerState) => getActivityBar(allHabits(s), barLog(s), DAY, s.targets[DAY]);
    expect(bar(after)).toEqual(bar(before));
  });

  it('Undo brings the card back; skipping twice changes nothing', () => {
    const once = run(start(), skip);
    expect(run(once, skip)).toBe(once);
    const back = run(once, { type: 'unskipHabit', date: DAY, habitId: 'read' });
    expect(isSkipped(back.skips, DAY, 'read')).toBe(false);
  });
});
