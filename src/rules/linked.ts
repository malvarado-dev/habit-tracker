// Linked bad habits on a good habit's card (PRD-15 Design 1, P2-08b). A bad habit paired with a
// good habit is logged by sliding that habit's card. Its slips are tracking too ("slate counts as
// tracked"), so each one fills one of the good habit's ring segments, after the gold ones, and
// moves the Activity Bar like a gold log. Standalone slips never do. Skip hides a card for today
// and changes nothing else, so it can never make the bar easier (decided 2026-10-25).
// Plain TypeScript, no screens.

import { slipCount, type BadHabit, type SlipCounts } from './badHabits';
import type { DateKey } from './dates';
import { logCount, timesPerDay, type Habit, type LogCounts } from './habits';

/** Habits skipped for today, keyed by date. */
export type Skips = Record<DateKey, string[]>;

/** The bad habit paired with this good habit, if any. */
export function linkedBadHabit(habit: Habit, badHabits: BadHabit[]): BadHabit | undefined {
  return badHabits.find((b) => b.pairedWith === habit.id);
}

/** The good habit's gold logs and its linked slips (slate) on a day. */
export function dayLogs(
  habit: Habit,
  log: LogCounts,
  slips: SlipCounts,
  badHabits: BadHabit[],
  date: DateKey,
): { gold: number; slate: number; total: number } {
  const gold = logCount(log, date, habit.id);
  const linked = linkedBadHabit(habit, badHabits);
  const slate = linked ? slipCount(slips, date, linked.id) : 0;
  return { gold, slate, total: gold + slate };
}

/**
 * Logs per habit with linked slips added in, for the Activity Bar and locked days. Standalone
 * slips are left out on purpose: they only track (PRD-15).
 */
export function withLinkedSlips(
  habits: Habit[],
  log: LogCounts,
  slips: SlipCounts,
  badHabits: BadHabit[],
): LogCounts {
  const out: LogCounts = {};
  const dates = new Set([...Object.keys(log), ...Object.keys(slips)]);
  for (const date of dates) {
    const day: Record<string, number> = { ...log[date] };
    for (const habit of habits) {
      const linked = linkedBadHabit(habit, badHabits);
      const slate = linked ? slipCount(slips, date, linked.id) : 0;
      if (slate > 0) day[habit.id] = (day[habit.id] ?? 0) + slate;
    }
    if (Object.keys(day).length > 0) out[date] = day;
  }
  return out;
}

/** Skipped for today. */
export function isSkipped(skips: Skips, date: DateKey, habitId: string): boolean {
  return skips[date]?.includes(habitId) ?? false;
}

/** Finished: gold plus slate logs reach the habit's times per day. */
export function isDone(habit: Habit, total: number): boolean {
  return total >= timesPerDay(habit);
}
