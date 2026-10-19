// Critter mood, kept apart from the component so they can be tested without rendering.
// Mood shows in the mouth (critter.md): asleep, okay, happy, delighted.

import type { SkyLevel } from '@/rules/sky';

export type CritterMood = 'asleep' | 'okay' | 'happy' | 'delighted';

/** Asleep before the first check-in, then the live rank sets the mouth. A Rest day is okay. */
export function critterMood(level: SkyLevel): CritterMood {
  if (level === 'asleep') return 'asleep';
  if (level === 'S') return 'delighted';
  if (level === 'A' || level === 'B') return 'happy';
  return 'okay';
}

/** A random wait between min and max. `rand` is injectable so tests stay predictable. */
export function randomGap(min: number, max: number, rand: () => number = Math.random): number {
  return Math.round(min + (max - min) * rand());
}

export function critterLabel(mood: CritterMood): string {
  if (mood === 'asleep') return 'Your critter is asleep. Check in to wake it up.';
  if (mood === 'delighted') return 'Your critter is delighted.';
  if (mood === 'happy') return 'Your critter is happy.';
  return 'Your critter is awake.';
}
