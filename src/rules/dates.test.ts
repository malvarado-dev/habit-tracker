import { describe, expect, it } from '@jest/globals';
import {
  addDays,
  addMonths,
  daysBetween,
  daysInMonth,
  daysLeftInWeek,
  daysOfWeek,
  earlierDaysThisWeek,
  toDateKey,
  weekdayIndex,
  weekPosition,
  weekStart,
} from './dates';

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

  // Saved weekday numbers stay Monday 0 to Sunday 6. The week itself runs Sunday to Saturday.
  it.each([
    ['2026-10-11', 6, 0, 7],
    ['2026-10-12', 0, 1, 6],
    ['2026-10-14', 2, 3, 4],
    ['2026-10-17', 5, 6, 1],
    ['2026-10-18', 6, 0, 7],
  ])('%s is saved weekday %d, position %d in the week, %d days left', (date, index, pos, left) => {
    expect(weekdayIndex(date)).toBe(index);
    expect(weekPosition(date)).toBe(pos);
    expect(daysLeftInWeek(date)).toBe(left);
  });

  it('weeks start on Sunday', () => {
    expect(weekStart('2026-10-17')).toBe('2026-10-11');
    expect(weekStart('2026-10-18')).toBe('2026-10-18');
    expect(daysOfWeek('2026-10-14')).toEqual([
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
    ]);
  });

  it('a different week start moves the week (one setting drives it)', () => {
    expect(weekStart('2026-10-18', 0)).toBe('2026-10-12');
    expect(weekPosition('2026-10-12', 0)).toBe(0);
  });

  it('lists earlier days of the same week only', () => {
    expect(earlierDaysThisWeek('2026-10-11')).toEqual([]);
    expect(earlierDaysThisWeek('2026-10-13')).toEqual(['2026-10-11', '2026-10-12']);
  });

  it('counts days between dates and walks months', () => {
    expect(daysBetween('2026-10-17', '2026-10-19')).toBe(2);
    expect(daysBetween('2026-10-19', '2026-10-17')).toBe(-2);
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(daysInMonth('2026-02')).toHaveLength(28);
    expect(daysInMonth('2026-10').at(-1)).toBe('2026-10-31');
  });

  it('rejects a malformed date', () => {
    expect(() => addDays('not-a-date', 1)).toThrow(RangeError);
  });
});
