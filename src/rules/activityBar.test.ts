// PRD-14 Activity Bar table, case by case. Every row of "Edge cases to test" is here.
import { describe, expect, it } from '@jest/globals';

import { tuning } from '@/config/tuning';
import {
  countedLogs,
  dayTarget,
  filledLogs,
  getActivityBar,
  possibleLogs,
  targetFromPossible,
} from './activityBar';
import type { Habit } from './habits';

// A Sunday. Every habit below is due every day unless it's Any days.
const DAY = '2026-10-25';

const due = (id: string, timesPerDay = 1, extra: Partial<Habit> = {}): Habit => ({
  id,
  name: id,
  color: 'habit1',
  schedule: { kind: 'specificDays', days: [0, 1, 2, 3, 4, 5, 6] },
  timesPerDay,
  ...extra,
});
const anytime = (id: string, timesPerDay = 1): Habit => ({
  id,
  name: id,
  color: 'habit1',
  schedule: { kind: 'anyDays' },
  timesPerDay,
});
const many = (n: number) => Array.from({ length: n }, (_, i) => due(`h${i}`));

describe('Activity Bar target (PRD-14 edge cases)', () => {
  it('1 habit needs 1 log', () => expect(dayTarget(many(1), DAY)).toBe(1));
  it('2 habits need 2 logs (all)', () => expect(dayTarget(many(2), DAY)).toBe(2));
  it('3 habits need 2 logs', () => expect(dayTarget(many(3), DAY)).toBe(2));
  it('only Drink Water 8 needs 2 logs (counted as 3)', () =>
    expect(dayTarget([due('water', 8)], DAY)).toBe(2));
  it('30 habits cap at 12 logs', () => expect(dayTarget(many(30), DAY)).toBe(12));

  it('only Anytime habits: 60% of their logs, each counted up to 3', () => {
    const habits = [anytime('exercise'), anytime('study', 5), anytime('walk', 2)];
    // 1 + 3 + 2 = 6 possible, 60% rounded up = 4.
    expect(possibleLogs(habits, DAY)).toBe(6);
    expect(dayTarget(habits, DAY)).toBe(4);
  });

  it('the PRD example: Water 8, Eat Healthy 3, Stretch, Read = 8 possible, full at 5', () => {
    const habits = [due('water', 8), due('eat', 3), due('stretch'), due('read'), anytime('gym')];
    expect(possibleLogs(habits, DAY)).toBe(8);
    expect(dayTarget(habits, DAY)).toBe(5);
  });

  it('Anytime habits stay out of the total when something is due', () => {
    expect(possibleLogs([due('a'), anytime('b', 3)], DAY)).toBe(1);
  });

  it('a habit on a day it is not due is optional', () => {
    // Monday-only habit on a Sunday, next to one due habit.
    const mondays = due('m', 1, { schedule: { kind: 'specificDays', days: [0] } });
    expect(possibleLogs([due('a'), mondays], DAY)).toBe(1);
  });

  it('no habits at all is a Rest day', () => {
    expect(targetFromPossible(0)).toBe(0);
    expect(getActivityBar([], {}, DAY).isRestDay).toBe(true);
  });

  it('values come from the tuning file', () => {
    const t = tuning.activityBar;
    expect([t.fullShare, t.capPerHabit, t.minToFill, t.maxToFill]).toEqual([0.6, 3, 2, 12]);
    expect(countedLogs(8)).toBe(t.capPerHabit);
  });
});

describe('Activity Bar fill', () => {
  const habits = [due('water', 8), due('eat', 3), due('stretch'), due('read'), anytime('gym')];

  it('every log adds the same amount, each habit counted up to 3', () => {
    const log = { [DAY]: { water: 6, stretch: 1 } };
    expect(filledLogs(habits, log, DAY)).toBe(4);
    expect(getActivityBar(habits, log, DAY).fill).toBeCloseTo(4 / 5);
  });

  it('optional logs fill the bar as a bonus', () => {
    const log = { [DAY]: { water: 3, gym: 1, read: 1 } };
    const bar = getActivityBar(habits, log, DAY);
    expect(bar.isFull).toBe(true);
    expect(bar.fill).toBe(1);
  });

  it('past full stays at 1', () => {
    const log = { [DAY]: { water: 3, eat: 3, stretch: 1, read: 1 } };
    expect(getActivityBar(habits, log, DAY).fill).toBe(1);
  });

  it('a saved target wins over the live habits', () => {
    // Removed habits mid-day: the target saved at the start of the day still holds.
    const bar = getActivityBar([due('a')], { [DAY]: { a: 1 } }, DAY, 4);
    expect(bar.target).toBe(4);
    expect(bar.isFull).toBe(false);
  });
});
