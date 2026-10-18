import { describe, expect, it } from '@jest/globals';
import { addDays, daysLeftInWeek, earlierDaysThisWeek, toDateKey, weekdayIndex } from './dates';

// 2026-10-12 is a Monday.
describe('dates', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 9, 7))).toBe('2026-10-07');
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it.each([
    ['2026-10-12', 0, 7],
    ['2026-10-14', 2, 5],
    ['2026-10-17', 5, 2],
    ['2026-10-18', 6, 1],
  ])('%s is weekday %d with %d days left', (date, index, left) => {
    expect(weekdayIndex(date)).toBe(index);
    expect(daysLeftInWeek(date)).toBe(left);
  });

  it('lists earlier days of the same week only', () => {
    expect(earlierDaysThisWeek('2026-10-12')).toEqual([]);
    expect(earlierDaysThisWeek('2026-10-14')).toEqual(['2026-10-12', '2026-10-13']);
  });

  it('rejects a malformed date', () => {
    expect(() => addDays('not-a-date', 1)).toThrow(RangeError);
  });
});
