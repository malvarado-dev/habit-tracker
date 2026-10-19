// Calendar helpers for the scoring rules. Dates are plain 'YYYY-MM-DD' strings so they
// are easy to store, compare, and read in tests. Math is done in UTC so daylight saving
// changes can never shift a day.

import { calendar } from '@/config/calendar';

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

/**
 * The saved weekday number for a date: Monday is 0, Sunday is 6. This is what habit goals store,
 * and it never changes with the week-start setting.
 */
export function weekdayIndex(key: DateKey): number {
  return (parse(key).getUTCDay() + 6) % 7;
}

/** Where a date falls in its week, 0 for the first day. Weeks start on calendar.weekStartsOn. */
export function weekPosition(key: DateKey, weekStartsOn: number = calendar.weekStartsOn): number {
  return (weekdayIndex(key) - weekStartsOn + 7) % 7;
}

/** The first day of the week a date falls in. */
export function weekStart(key: DateKey, weekStartsOn: number = calendar.weekStartsOn): DateKey {
  return addDays(key, -weekPosition(key, weekStartsOn));
}

/** The seven days of the week a date falls in, in order. */
export function daysOfWeek(key: DateKey, weekStartsOn: number = calendar.weekStartsOn): DateKey[] {
  const first = weekStart(key, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

/** Days left in the week, counting today. 7 on the first day, 1 on the last. */
export function daysLeftInWeek(key: DateKey): number {
  return 7 - weekPosition(key);
}

/** Earlier days of the same week, oldest first. Empty on the first day of the week. */
export function earlierDaysThisWeek(key: DateKey): DateKey[] {
  const count = weekPosition(key);
  return Array.from({ length: count }, (_, i) => addDays(key, i - count));
}

/** Whole days from one date to another (negative if `to` is earlier). */
export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / MS_PER_DAY);
}

/** 'YYYY-MM' for the month a date is in. */
export function monthOf(key: DateKey): string {
  return key.slice(0, 7);
}

/** The first day of the month after (or before, with -1) a 'YYYY-MM' month. */
export function addMonths(month: string, months: number): string {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1 + months, 1));
  return format(date).slice(0, 7);
}

/** Every day in a 'YYYY-MM' month, in order. */
export function daysInMonth(month: string): DateKey[] {
  const first = `${month}-01`;
  const days: DateKey[] = [];
  for (let day = first; monthOf(day) === month; day = addDays(day, 1)) days.push(day);
  return days;
}
