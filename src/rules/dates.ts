// Calendar helpers for the scoring rules. Dates are plain 'YYYY-MM-DD' strings so they
// are easy to store, compare, and read in tests. Math is done in UTC so daylight saving
// changes can never shift a day.

export type DateKey = string;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parse(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) throw new RangeError(`Not a date key: ${key}`);
  return new Date(Date.UTC(y, m - 1, d));
}

function format(date: Date): DateKey {
  return date.toISOString().slice(0, 10);
}

/** The user's local calendar day for a real Date. */
export function toDateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(key: DateKey, days: number): DateKey {
  return format(new Date(parse(key).getTime() + days * MS_PER_DAY));
}

/** Weeks run Monday to Sunday (SPEC-00). Monday is 0, Sunday is 6. */
export function weekdayIndex(key: DateKey): number {
  return (parse(key).getUTCDay() + 6) % 7;
}

/** Days left in the week, counting today. Monday is 7, Sunday is 1. */
export function daysLeftInWeek(key: DateKey): number {
  return 7 - weekdayIndex(key);
}

/** Earlier days of the same week, oldest first. Empty on Monday. */
export function earlierDaysThisWeek(key: DateKey): DateKey[] {
  const count = weekdayIndex(key);
  return Array.from({ length: count }, (_, i) => addDays(key, i - count));
}
