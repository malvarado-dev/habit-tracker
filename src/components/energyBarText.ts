// Energy bar words and math, kept apart from the component so they can be tested without rendering.
// The bar shows today's score (getEnergy): every star moves it, the checkered flag marks the S
// cutoff, and 100% means 3 stars on everything that counts today (decided 2026-10-18).

import { tuning } from '@/config/tuning';

/** Where the flag stands on the bar, 0 to 1: the S rank cutoff. */
export function flagPosition(): number {
  return tuning.rank.cutoffs.S;
}

/** Clamp a fill value to the bar. */
export function clampEnergy(energy: number): number {
  return Math.min(1, Math.max(0, energy));
}

/** What a screen reader hears. The bar itself shows no text. */
export function energyLabel(earned: number, possible: number, isRestDay: boolean): string {
  if (isRestDay) return 'Rest day, no habits due';
  const s = Math.round(flagPosition() * 100);
  return `${earned} of ${possible} stars. S rank at ${s} percent.`;
}

export type EnergyMilestone = 'flag' | 'full';

/**
 * Which celebration a fill change earns: reaching 100% beats reaching the flag. Only upward
 * crossings count, so opening the app never plays one, and dropping back then crossing again
 * plays it again. A Rest day is full without earning anything, so it never celebrates.
 */
export function energyMilestone(
  previous: number,
  next: number,
  isRestDay: boolean,
): EnergyMilestone | null {
  if (isRestDay) return null;
  if (next >= 1 && previous < 1) return 'full';
  const flag = flagPosition();
  if (next >= flag && previous < flag) return 'flag';
  return null;
}
