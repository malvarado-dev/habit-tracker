import { describe, expect, it } from '@jest/globals';
import { EVERY_DAY, getDailyResult, type Habit } from './scoring';
import { getSkyLevel, getSkyTime, statusBarStyle } from './sky';

const habits: Habit[] = [
  { id: 'sleep', name: 'Sleep', goal: { kind: 'specificDays', days: EVERY_DAY }, color: 'habit1' },
  { id: 'diet', name: 'Diet', goal: { kind: 'specificDays', days: EVERY_DAY }, color: 'habit1' },
];
const MON = '2026-10-12';

describe('getSkyLevel', () => {
  it('is asleep before the first check-in', () => {
    expect(getSkyLevel(getDailyResult(habits, {}, MON))).toBe('asleep');
  });

  it('wakes up and follows the live rank', () => {
    const half = getDailyResult(habits, { [MON]: { sleep: 'NailedIt' } }, MON);
    expect(getSkyLevel(half)).toBe('B');
    const full = getDailyResult(habits, { [MON]: { sleep: 'NailedIt', diet: 'NailedIt' } }, MON);
    expect(getSkyLevel(full)).toBe('S');
  });

  it('Skip wakes the sky but never lowers it', () => {
    const skipped = getDailyResult(habits, { [MON]: { sleep: 'NotToday', diet: 'NailedIt' } }, MON);
    expect(getSkyLevel(skipped)).toBe('S');
  });

  it('an optional check-in on a day with nothing due wakes the sky', () => {
    const exercise: Habit = {
      id: 'ex',
      name: 'Exercise',
      goal: { kind: 'anyDays', timesPerWeek: 3 },
      color: 'habit1',
    };
    const result = getDailyResult([exercise], { [MON]: { ex: 'NailedIt' } }, MON);
    expect(getSkyLevel(result)).toBe('S');
  });

  it('shows a calm Rest day sky when nothing is due', () => {
    expect(getSkyLevel(getDailyResult([], {}, MON))).toBe('rest');
  });
});

describe('getSkyTime', () => {
  it.each([
    [5, 'night'],
    [6, 'day'],
    [16, 'day'],
    [17, 'dusk'],
    [19, 'dusk'],
    [20, 'night'],
    [0, 'night'],
  ])('hour %d shows the %s sky', (hour, expected) => {
    expect(getSkyTime(hour)).toBe(expected);
  });
});

describe('statusBarStyle', () => {
  it('follows the sky, not the theme: dark icons by day, light at dusk and night', () => {
    expect(statusBarStyle('day')).toBe('dark');
    expect(statusBarStyle('dusk')).toBe('light');
    expect(statusBarStyle('night')).toBe('light');
  });
});
