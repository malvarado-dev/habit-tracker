// Which habits the habit sheet shows, and in which section (P2-07). Plain TypeScript so it can be
// unit tested without rendering.
//
// Finished cards leave the list: a habit is finished once today's check-ins reach the number of
// times the habit is meant to be done today. Until P2-08 adds per-day counts, a check-in has one
// level a day, so Nailed it is the finished level.

import type { DateKey } from './dates';
import type { CheckIn, CheckInLog, Habit, HabitSection } from './scoring';

/** True once today's check-in reaches the habit's daily amount (Nailed it until P2-08). */
export function isFinishedToday(checkIn: CheckIn | undefined): boolean {
  return checkIn === 'NailedIt';
}

/** The section a habit sits in. Missing means Today. */
export function sectionOf(habit: Habit): HabitSection {
  return habit.section ?? 'today';
}

export type SheetSections = { today: Habit[]; anytime: Habit[] };

/** Unfinished habits split into Today and Anytime, each kept in the saved order. */
export function groupHabits(habits: Habit[], log: CheckInLog, date: DateKey): SheetSections {
  const dayLog = log[date] ?? {};
  const out: SheetSections = { today: [], anytime: [] };
  for (const habit of habits) {
    if (isFinishedToday(dayLog[habit.id])) continue;
    out[sectionOf(habit)].push(habit);
  }
  return out;
}
