// Critter face, kept apart from the component so it can be tested without rendering.
// Wide layout's Prototype 1 critter. Ranks are gone (P2-08a), so the mouth follows the Activity
// Bar: asleep before the first log (a tap or a log wakes it), a closed smile while logging, and
// a big smile once the bar is full. A Rest day is awake with a flat mouth.

import type { SkyLevel } from '@/rules/sky';

export type CritterMood = 'asleep' | 'flat' | 'smile' | 'big';

/** `woken` is true once the user taps the critter or logs a habit this visit. */
export function critterMood(level: SkyLevel, woken: boolean): CritterMood {
  if (level === 'asleep') return woken ? 'flat' : 'asleep';
  if (level === 'rest') return 'flat';
  if (level === 'awake') return 'smile';
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
