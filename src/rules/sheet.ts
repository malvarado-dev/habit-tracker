// Which habits the habit sheet shows, and in which section (P2-07). Plain TypeScript so it can be
// unit tested without rendering.
//
// Finished cards leave the list (P2-08a): a habit is finished once today's logs reach its times
// per day. History is where finished habits can still be seen and changed.

import type { DateKey } from './dates';
import { logCount, timesPerDay, type Habit, type HabitSection, type LogCounts } from './habits';

/** True once today's logs reach the habit's times per day. */
export function isFinishedToday(habit: Habit, count: number): boolean {
  return count >= timesPerDay(habit);
}

/** The section a habit sits in. Missing means Today. */
export function sectionOf(habit: Habit): HabitSection {
  return habit.section ?? 'today';
}

export type SheetSections = { today: Habit[]; anytime: Habit[] };

/** Unfinished habits split into Today and Anytime, each kept in the saved order. */
export function groupHabits(habits: Habit[], log: LogCounts, date: DateKey): SheetSections {
  const out: SheetSections = { today: [], anytime: [] };
  for (const habit of habits) {
    if (isFinishedToday(habit, logCount(log, date, habit.id))) continue;
    out[sectionOf(habit)].push(habit);
  }
  return out;
}
