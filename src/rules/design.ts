// The bad habits playtest switch (PRD-15 Playtest plan, P2-10). Design 1 is the main design:
// linked bad habits and per-habit frequency. Design 2 is the alternative: no frequency, so every
// good habit is one tap, and mirror bad habits are hidden. The switch only changes how habits are
// read. It never edits or removes a saved habit, log, or slip, so switching back restores Design 1
// exactly (for example, Water at 3/8 shows 3/8 again). Plain TypeScript, unit tested.

import type { DateKey } from './dates';
import { timesPerDay, type Habit } from './habits';
import type { BadHabitDesign } from './badHabits';

/** How many logs finish a habit today under a design. Design 2 has no frequency: always 1. */
export function timesFor(habit: Habit, design: BadHabitDesign): number {
  return design === 'design2' ? 1 : timesPerDay(habit);
}

/**
 * Habits as a design sees them. Design 2 drops the frequency, so every screen rule (rings,
 * counts, finished, Activity Bar) reads one tap. Returns the same array in Design 1.
 */
export function habitsForDesign(habits: Habit[], design: BadHabitDesign): Habit[] {
  if (design === 'design1') return habits;
  return habits.map((h) => {
    if (h.timesPerDay === undefined) return h;
    const { timesPerDay: _times, ...rest } = h;
    return rest;
  });
}

/** Logs and slips made under one design on one day, for the playtest comparison. */
export interface DesignTally {
  logs: number;
  slips: number;
}

/** Every day's tally, per design. Display never reads this; it's playtest data only. */
export type DesignTallies = Record<DateKey, Partial<Record<BadHabitDesign, DesignTally>>>;

/** Adds a change to a day's tally for a design. Never goes below 0. */
export function addToTally(
  tallies: DesignTallies,
  date: DateKey,
  design: BadHabitDesign,
  change: Partial<DesignTally>,
): DesignTallies {
  const day = tallies[date] ?? {};
  const now = day[design] ?? { logs: 0, slips: 0 };
  const next = {
    logs: Math.max(0, now.logs + (change.logs ?? 0)),
    slips: Math.max(0, now.slips + (change.slips ?? 0)),
  };
  if (next.logs === now.logs && next.slips === now.slips) return tallies;
  return { ...tallies, [date]: { ...day, [design]: next } };
}
