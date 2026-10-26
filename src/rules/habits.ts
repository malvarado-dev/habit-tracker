// What a habit is, and when it's due (PRD-15). Replaces Prototype 1's scoring rules: there are no
// stars, ranks, or weekly goals any more. A habit has a schedule (when it's due) and a times-per-day
// number (how many logs finish it today). Plain TypeScript with no screens, so it's unit tested.

import { tuning } from '@/config/tuning';
import { weekdayIndex, type DateKey } from './dates';

/**
 * Saved weekday number: Monday is 0, Sunday is 6. Fixed for saved habits; which day starts the
 * week is a separate setting (src/config/calendar.ts).
 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * When a habit is due (Glossary: Schedule):
 * - Specific days: due on the picked weekdays.
 * - Any days: never due, so it's always optional (a habit like Exercise).
 */
export type Schedule = { kind: 'specificDays'; days: Weekday[] } | { kind: 'anyDays' };

/** One of the 8 curated habit colors (design-system.md, habit-1 to habit-8). */
export type HabitColor =
  'habit1' | 'habit2' | 'habit3' | 'habit4' | 'habit5' | 'habit6' | 'habit7' | 'habit8';

export const HABIT_COLORS: HabitColor[] = [
  'habit1',
  'habit2',
  'habit3',
  'habit4',
  'habit5',
  'habit6',
  'habit7',
  'habit8',
];

/** Habit sheet sections (P2-07): Today first, then Anytime. */
export type HabitSection = 'today' | 'anytime';

export interface Habit {
  id: string;
  name: string;
  schedule: Schedule;
  color: HabitColor;
  /**
   * Logs that finish the habit today (P2-08a). Missing means 1. Set in Test tools for now.
   * Above 1, the card shows a segmented ring and a count.
   */
  timesPerDay?: number;
  /** The day the habit was added. Missing on habits that existed before the rule. */
  addedOn?: DateKey;
  /** The day the habit was removed (T21). It doesn't count on this day or after. */
  removedOn?: DateKey;
  /** Which habit sheet section the habit sits in (P2-07). Missing means Today. */
  section?: HabitSection;
}

/** Logs per habit, keyed by date, then by habit id. A missing entry means 0 logs. */
export type LogCounts = Record<DateKey, Record<string, number>>;

export const EVERY_DAY: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** Keeps times per day a whole number from 1 to the max in tuning.ts. */
export function cleanTimesPerDay(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(tuning.activityBar.timesPerDayMax, Math.max(1, Math.round(value)));
}

/** How many logs finish this habit today. */
export function timesPerDay(habit: Habit): number {
  return cleanTimesPerDay(habit.timesPerDay ?? 1);
}

/** Today's logs for one habit. */
export function logCount(log: LogCounts, date: DateKey, habitId: string): number {
  return log[date]?.[habitId] ?? 0;
}

/**
 * The habit was active on this date: on or after the day it was added, and before the day it
 * was removed (T21).
 */
export function existsOn(habit: Habit, date: DateKey): boolean {
  if (habit.addedOn !== undefined && date < habit.addedOn) return false;
  if (habit.removedOn !== undefined && date >= habit.removedOn) return false;
  return true;
}

/** Due: a Specific days habit on one of its picked days. Any days habits are never due. */
export function isDue(habit: Habit, date: DateKey): boolean {
  if (habit.schedule.kind !== 'specificDays') return false;
  if (!existsOn(habit, date)) return false;
  return habit.schedule.days.includes(weekdayIndex(date) as Weekday);
}

/** Optional: active that day but not due (Glossary). Its logs still fill the Activity Bar. */
export function isOptional(habit: Habit, date: DateKey): boolean {
  return existsOn(habit, date) && !isDue(habit, date);
}
