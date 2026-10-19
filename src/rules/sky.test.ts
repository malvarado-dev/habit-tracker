import { describe, expect, it } from '@jest/globals';
import { EVERY_DAY, getDailyResult, type Habit } from './scoring';
import { getSkyLevel, isDaytime } from './sky';

const habits: Habit[] = [
  { id: 'sleep', name: 'Sleep', goal: { kind: 'specificDays', days: EVERY_DAY } },
  { id: 'diet', name: 'Diet', goal: { kind: 'specificDays', days: EVERY_DAY } },
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

  it('Not today wakes the sky but never lowers it', () => {
    const skipped = getDailyResult(habits, { [MON]: { sleep: 'NotToday', diet: 'NailedIt' } }, MON);
    expect(getSkyLevel(skipped)).toBe('S');
  });

  it('an optional check-in on a day with nothing due wakes the sky', () => {
    const exercise: Habit = {
      id: 'ex',
      name: 'Exercise',
      goal: { kind: 'anyDays', timesPerWeek: 3 },
    };
    const result = getDailyResult([exercise], { [MON]: { ex: 'NailedIt' } }, MON);
    expect(getSkyLevel(result)).toBe('S');
  });

  it('shows a calm Rest day sky when nothing is due', () => {
    expect(getSkyLevel(getDailyResult([], {}, MON))).toBe('rest');
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
