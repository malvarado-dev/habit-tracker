// Critter mood and glow, kept apart from the component so they can be tested without rendering.
// Mood shows in the mouth (critter.md): asleep, okay, happy, delighted.

import { tuning } from '@/config/tuning';
import type { SkyLevel } from '@/rules/sky';

export type CritterMood = 'asleep' | 'okay' | 'happy' | 'delighted';

/** Asleep before the first check-in, then the live rank sets the mouth. A Rest day is okay. */
export function critterMood(level: SkyLevel): CritterMood {
  if (level === 'asleep') return 'asleep';
  if (level === 'S') return 'delighted';
  if (level === 'A' || level === 'B') return 'happy';
  return 'okay';
}

/** Halo strength, 0 to glowMax. Grows with today's score; none while asleep. */
export function critterGlow(level: SkyLevel, score: number | null): number {
  if (level === 'asleep' || score === null) return 0;
  const clamped = Math.min(1, Math.max(0, score));
  return tuning.critter.glowMin + (tuning.critter.glowMax - tuning.critter.glowMin) * clamped;
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
