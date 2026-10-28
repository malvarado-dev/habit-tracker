import { describe, expect, it } from '@jest/globals';

import type { Schedule, Weekday } from '@/rules/habits';

import { listLine, matchingPreset, resultLine, switchSchedule, toggleDay } from './schedule';

const specific = (...days: Weekday[]): Schedule => ({ kind: 'specificDays', days });
const any: Schedule = { kind: 'anyDays' };

describe('acceptance: the result line reads correctly for every schedule', () => {
  it.each([
    [[0] as Weekday[], '1 day a week'],
    [[0, 2, 4] as Weekday[], '3 days a week'],
    [[0, 1, 2, 3, 4] as Weekday[], '5 days a week'],
    [[0, 1, 2, 3, 4, 5, 6] as Weekday[], 'Every day'],
  ])('Specific days %j reads "%s"', (days, text) => {
    expect(resultLine(specific(...days))).toBe(text);
  });

  it('Any days reads "Any days", on Edit habit and the Habits list', () => {
    expect(resultLine(any)).toBe('Any days');
    expect(listLine(any)).toBe('Any days');
    expect(listLine(specific(0, 2, 4))).toBe('3 days a week');
  });
});

describe('Specific days picker', () => {
  it('shows frequency only at two or more, for every schedule type', () => {
    expect(listLine(any, 1)).toBe('Any days');
    expect(listLine(any, 2)).toBe('Any days, 2x per day');
    expect(listLine(specific(0, 2, 4), 3)).toBe('3 days a week, 3x per day');
    expect(listLine(specific(0, 1, 2, 3, 4, 5, 6), 3)).toBe('Every day, 3x per day');
  });
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
});

describe('switching Specific days and Any days', () => {
  it('Any days has no count', () => {
    expect(switchSchedule(specific(0, 2, 4), 'anyDays')).toEqual(any);
  });

  it('brings back the days picked before, or every day', () => {
    expect(switchSchedule(any, 'specificDays', [1, 3, 5])).toEqual(specific(1, 3, 5));
    expect(switchSchedule(any, 'specificDays')).toEqual(specific(0, 1, 2, 3, 4, 5, 6));
  });

  it('does nothing when already on that kind', () => {
    expect(switchSchedule(any, 'anyDays')).toBe(any);
  });
});
