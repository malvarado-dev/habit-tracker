import { describe, expect, it } from '@jest/globals';

import type { Habit } from './habits';
import { groupHabits, isFinishedToday, sectionOf } from './sheet';

const habit = (id: string, section?: Habit['section'], timesPerDay?: number): Habit => ({
  id,
  name: id,
  color: 'habit1',
  schedule: { kind: 'anyDays' },
  ...(section ? { section } : {}),
  ...(timesPerDay ? { timesPerDay } : {}),
});

const DAY = '2026-10-25';

describe('habit sheet sections (P2-07)', () => {
  it('a habit with no section sits in Today', () => {
    expect(sectionOf(habit('a'))).toBe('today');
    expect(sectionOf(habit('b', 'anytime'))).toBe('anytime');
  });

  it('splits habits into Today and Anytime, keeping their order', () => {
    const habits = [habit('a'), habit('b', 'anytime'), habit('c', 'today'), habit('d', 'anytime')];
    const { today, anytime } = groupHabits(habits, {}, DAY);
    expect(today.map((h) => h.id)).toEqual(['a', 'c']);
    expect(anytime.map((h) => h.id)).toEqual(['b', 'd']);
  });
});

describe('finished rule (P2-08a)', () => {
  it('a habit is finished when its count reaches times per day', () => {
    expect(isFinishedToday(habit('a'), 0)).toBe(false);
    expect(isFinishedToday(habit('a'), 1)).toBe(true);
    expect(isFinishedToday(habit('w', undefined, 8), 7)).toBe(false);
    expect(isFinishedToday(habit('w', undefined, 8), 8)).toBe(true);
  });

  it('finished cards leave the list; partly done cards stay', () => {
    const habits = [habit('a'), habit('w', undefined, 3), habit('c', 'anytime')];
    const log = { [DAY]: { a: 1, w: 2, c: 1 } };
    const { today, anytime } = groupHabits(habits, log, DAY);
    expect(today.map((h) => h.id)).toEqual(['w']);
    expect(anytime).toEqual([]);
  });

  it('only today counts toward finished', () => {
    const log = { '2026-10-24': { a: 1 } };
    expect(groupHabits([habit('a')], log, DAY).today).toHaveLength(1);
  });
});
