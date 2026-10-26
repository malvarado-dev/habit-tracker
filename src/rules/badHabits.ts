// Bad habits (PRD-15 Bad habits, P2-09). A bad habit is a slip the user wants to see go down,
// like Eat Out or Soda. It's either paired with one good habit (logged by sliding that card,
// P2-08b) or standalone (counted in the Bad habits tray). Slips are kept apart from good-habit
// logs on purpose: standalone slips earn no Coins and no Activity Bar progress, and keeping them
// in their own record means the bar math can never count one by mistake. Plain TypeScript.

import type { DateKey } from './dates';
import type { Habit } from './habits';

export interface BadHabit {
  id: string;
  name: string;
  /** The good habit it's paired with (Design 1). Missing means standalone. */
  pairedWith?: string;
  /** The day it was added. */
  addedOn?: DateKey;
}

/** Slip counts per bad habit per day. A missing entry means 0. */
export type SlipCounts = Record<DateKey, Record<string, number>>;

/** The bad habits layout under test (P2-10). Design 1 pairs; Design 2 has no pairing. */
export type BadHabitDesign = 'design1' | 'design2';

/** A day's slips for one bad habit. */
export function slipCount(slips: SlipCounts, date: DateKey, id: string): number {
  return slips[date]?.[id] ?? 0;
}

/** Keeps a count a whole number, never below 0. */
export function cleanCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

/**
 * Paired with a good habit the user still has. A pairing to a removed habit falls back to
 * standalone, so the bad habit never disappears with nowhere to log it.
 */
export function isPaired(bad: BadHabit, habits: Habit[]): boolean {
  return bad.pairedWith !== undefined && habits.some((h) => h.id === bad.pairedWith);
}

/**
 * The bad habits that show in the tray. Design 1: only standalone ones (paired ones are logged
 * from their good habit's card). Design 2: every bad habit, since it has no pairing.
 */
export function trayHabits(
  badHabits: BadHabit[],
  habits: Habit[],
  design: BadHabitDesign,
): BadHabit[] {
  if (design === 'design2') return badHabits;
  return badHabits.filter((b) => !isPaired(b, habits));
}
