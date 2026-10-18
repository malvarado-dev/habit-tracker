import { describe, expect, it } from '@jest/globals';
import { getDailyResult, type Habit } from './scoring';
import { getSkyLevel, isDaytime } from './sky';

const habits: Habit[] = [
  { id: 'sleep', name: 'Sleep', weeklyTarget: 7 },
  { id: 'diet', name: 'Diet', weeklyTarget: 7 },
];
const MON = '2026-10-12';

describe('getSkyLevel', () => {
  it('is asleep before the first check-in', () => {
    expect(getSkyLevel(getDailyResult(habits, {}, MON), 'Beginner')).toBe('asleep');
  });

  it('wakes up and follows the live rank', () => {
    const half = getDailyResult(habits, { [MON]: { sleep: 'NailedIt' } }, MON);
    expect(getSkyLevel(half, 'Beginner')).toBe('B');
    const full = getDailyResult(habits, { [MON]: { sleep: 'NailedIt', diet: 'NailedIt' } }, MON);
    expect(getSkyLevel(full, 'Pro')).toBe('S');
  });

  it('a missed 7-day habit still wakes the sky, at C', () => {
    const missed = getDailyResult(habits, { [MON]: { sleep: 'NotToday' } }, MON);
    expect(getSkyLevel(missed, 'Beginner')).toBe('C');
  });

  it('shows a calm Rest day sky when nothing is due', () => {
    expect(getSkyLevel(getDailyResult([], {}, MON), 'Beginner')).toBe('rest');
  });
});

describe('isDaytime', () => {
  it.each([
    [5, false],
    [6, true],
    [17, true],
    [18, false],
  ])('hour %d is daytime: %s', (hour, expected) => {
    expect(isDaytime(hour)).toBe(expected);
  });
});
