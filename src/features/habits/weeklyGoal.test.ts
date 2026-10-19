import { describe, expect, it } from '@jest/globals';

import type { WeeklyGoal, Weekday } from '@/rules/scoring';

import {
  listLine,
  matchingPreset,
  resultLine,
  spreadDays,
  switchGoal,
  toggleDay,
} from './weeklyGoal';

const specific = (...days: Weekday[]): WeeklyGoal => ({ kind: 'specificDays', days });
const any = (timesPerWeek: number): WeeklyGoal => ({ kind: 'anyDays', timesPerWeek });

describe('acceptance: the result line reads correctly for every goal (T12)', () => {
  it.each([
    [1, '1 day a week'],
    [2, '2 days a week'],
    [3, '3 days a week'],
    [4, '4 days a week'],
    [5, '5 days a week'],
    [6, '6 days a week'],
    [7, 'Every day'],
  ])('Specific days with %i days reads "%s"', (n, text) => {
    expect(resultLine(specific(...spreadDays(n)))).toBe(text);
  });

  it.each([
    [1, '1 time a week, any days'],
    [2, '2 times a week, any days'],
    [3, '3 times a week, any days'],
    [4, '4 times a week, any days'],
    [5, '5 times a week, any days'],
    [6, '6 times a week, any days'],
    [7, '7 times a week, any days'],
  ])('Any days at %i reads "%s"', (n, text) => {
    expect(resultLine(any(n))).toBe(text);
  });

  it('the Habits list uses the short form', () => {
    expect(listLine(specific(0, 1, 2, 3, 4, 5, 6))).toBe('Every day');
    expect(listLine(specific(0, 2, 4))).toBe('3 days a week');
    expect(listLine(any(3))).toBe('Any days, 3 a week');
  });
});

describe('Specific days picker', () => {
  it('presets match only their exact days', () => {
    expect(matchingPreset([0, 1, 2, 3, 4, 5, 6])).toBe('everyDay');
    expect(matchingPreset([4, 0, 1, 2, 3])).toBe('weekdays');
    expect(matchingPreset([5, 6])).toBe('weekends');
    expect(matchingPreset([0, 2, 4])).toBeNull();
  });

  it('turns days on and off, sorted Monday first', () => {
    expect(toggleDay([0, 4], 2)).toEqual([0, 2, 4]);
    expect(toggleDay([0, 2, 4], 2)).toEqual([0, 4]);
  });

  it('never turns off the last day (minimum 1)', () => {
    expect(toggleDay([3], 3)).toEqual([3]);
  });

  it('spreads days sensibly for a habit with none picked yet', () => {
    expect(spreadDays(3)).toEqual([0, 2, 4]);
    expect(spreadDays(5)).toEqual([0, 1, 2, 3, 4]);
    for (let n = 1; n <= 7; n++) expect(spreadDays(n)).toHaveLength(n);
  });
});

describe('switching Specific days and Any days', () => {
  it('keeps the same number of days a week', () => {
    expect(switchGoal(specific(0, 2, 4), 'anyDays')).toEqual(any(3));
    expect(switchGoal(any(7), 'specificDays')).toEqual(specific(0, 1, 2, 3, 4, 5, 6));
  });

  it('brings back the days picked before when the count still matches', () => {
    expect(switchGoal(any(3), 'specificDays', [1, 3, 5])).toEqual(specific(1, 3, 5));
    expect(switchGoal(any(4), 'specificDays', [1, 3, 5])).toEqual(specific(...spreadDays(4)));
  });

  it('does nothing when already on that kind', () => {
    const goal = any(2);
    expect(switchGoal(goal, 'anyDays')).toBe(goal);
  });
});
