import { describe, expect, it } from '@jest/globals';

import type { Habit } from './scoring';
import { groupHabits, isFinishedToday, sectionOf } from './sheet';

const habit = (id: string, section?: Habit['section']): Habit => ({
  id,
  name: id,
  color: 'habit1',
  goal: { kind: 'anyDays', timesPerWeek: 3 },
  ...(section ? { section } : {}),
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

  it('finished cards leave the list; partly done cards stay', () => {
    const habits = [habit('a'), habit('b'), habit('c', 'anytime')];
    const log = {
      [DAY]: { a: 'NailedIt' as const, b: 'OnTrack' as const, c: 'NailedIt' as const },
    };
    const { today, anytime } = groupHabits(habits, log, DAY);
    expect(today.map((h) => h.id)).toEqual(['b']);
    expect(anytime).toEqual([]);
  });

  it('only today counts toward finished', () => {
    const log = { '2026-10-24': { a: 'NailedIt' as const } };
    expect(groupHabits([habit('a')], log, DAY).today).toHaveLength(1);
  });

  it('only the top level is finished', () => {
    expect(isFinishedToday(undefined)).toBe(false);
    expect(isFinishedToday('NotToday')).toBe(false);
    expect(isFinishedToday('Started')).toBe(false);
    expect(isFinishedToday('OnTrack')).toBe(false);
    expect(isFinishedToday('NailedIt')).toBe(true);
  });
});
