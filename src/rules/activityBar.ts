// The Activity Bar's math (PRD-14 Activity Bar table). Every log adds the same amount. The bar is
// full at a share of the day's possible logs, with each habit counted up to a cap, so one habit
// can't fill it alone. Optional habits are a bonus: their logs fill the bar but stay out of the
// total, unless nothing is due, when they make the total instead. All numbers live in tuning.ts.
//
// The target is fixed at the start of the day (decided 2026-10-25): the first open of a day saves
// it (state.targets), so adding or removing a habit later that day never moves the finish line.
// A day with no saved target (an old day, or a day never opened) works it out from its habits.
//
// Plain TypeScript, no screens.

import { tuning } from '@/config/tuning';
import type { DateKey } from './dates';
import { existsOn, isDue, isOptional, timesPerDay, type Habit, type LogCounts } from './habits';

/** Logs one habit can add to the possible total, and to the fill. */
export function countedLogs(times: number): number {
  return Math.min(times, tuning.activityBar.capPerHabit);
}

/**
 * Today's possible logs: due habits, each counted up to the cap. With nothing due, the day's
 * optional habits (like Anytime) make the total instead.
 */
export function possibleLogs(habits: Habit[], date: DateKey): number {
  const due = habits.filter((h) => isDue(h, date));
  const counted = due.length > 0 ? due : habits.filter((h) => isOptional(h, date));
  return counted.reduce((sum, h) => sum + countedLogs(timesPerDay(h)), 0);
}

/**
 * Logs needed to fill the bar: the full share of possible, rounded up, at least the minimum
 * (unless fewer are possible), at most the max. 0 means nothing can be logged: a Rest day.
 */
export function targetFromPossible(possible: number): number {
  const { fullShare, minToFill, maxToFill } = tuning.activityBar;
  if (possible <= 0) return 0;
  const share = Math.ceil(possible * fullShare - 1e-9);
  const floor = Math.min(minToFill, possible);
  return Math.min(maxToFill, Math.max(floor, share));
}

/** The target for a day from its habits, before any saved snapshot. */
export function dayTarget(habits: Habit[], date: DateKey): number {
  return targetFromPossible(possibleLogs(habits, date));
}

/**
 * Logs that fill the bar: every habit's logs that day, each counted up to the cap. Habits added
 * or removed later that day still count, since the target was fixed at the start of the day.
 */
export function filledLogs(habits: Habit[], log: LogCounts, date: DateKey): number {
  const day = log[date] ?? {};
  return habits.reduce((sum, h) => sum + countedLogs(day[h.id] ?? 0), 0);
}

export interface ActivityBarResult {
  /** Counted logs so far. */
  logs: number;
  /** Logs needed to fill the bar. 0 on a Rest day. */
  target: number;
  /** 0 to 1. Full on a Rest day. */
  fill: number;
  /** The bar is filled: this day counts as a check-in (Glossary). */
  isFull: boolean;
  /** Nothing to log at all. Shown full, never celebrates, keeps the streak but isn't a check-in. */
  isRestDay: boolean;
}

export function getActivityBar(
  habits: Habit[],
  log: LogCounts,
  date: DateKey,
  savedTarget?: number,
): ActivityBarResult {
  const target = savedTarget ?? dayTarget(habits, date);
  const logs = filledLogs(habits, log, date);
  if (target === 0) return { logs, target, fill: 1, isFull: false, isRestDay: true };
  return {
    logs,
    target,
    fill: Math.min(1, logs / target),
    isFull: logs >= target,
    isRestDay: false,
  };
}

/** Habits that can be logged on a day: everything active then. */
export function activeOn(habits: Habit[], date: DateKey): Habit[] {
  return habits.filter((h) => existsOn(h, date));
}
