// Critter face, kept apart from the component so it can be tested without rendering.
// critter.md (decided 2026-10-19): the mouth follows the live rank. C is a flat mouth,
// B a closed smile, A and S a big open smile. At C (and before the first check-in) the
// critter is asleep whenever the app opens; a tap or any score wakes it, and closing the
// app while still at C puts it back to sleep. A Rest day is awake with a flat mouth.
// These faces are also the day snapshots planned for History (PRD-05).

import type { SkyLevel } from '@/rules/sky';

export type CritterMood = 'asleep' | 'flat' | 'smile' | 'big';

/** `woken` is true once the user taps the critter or scores a habit this visit. */
export function critterMood(level: SkyLevel, woken: boolean): CritterMood {
  if (level === 'asleep' || level === 'C') return woken ? 'flat' : 'asleep';
  if (level === 'rest') return 'flat';
  if (level === 'B') return 'smile';
  return 'big';
}

/** A random wait between min and max. `rand` is injectable so tests stay predictable. */
export function randomGap(min: number, max: number, rand: () => number = Math.random): number {
  return Math.round(min + (max - min) * rand());
}

export function critterLabel(mood: CritterMood): string {
  if (mood === 'asleep') return 'Your critter is asleep. Tap it or check in to wake it up.';
  if (mood === 'big') return 'Your critter is delighted.';
  if (mood === 'smile') return 'Your critter is happy.';
  return 'Your critter is awake.';
}
