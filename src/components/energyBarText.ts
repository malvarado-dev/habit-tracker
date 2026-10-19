// Energy bar words and math, kept apart from the component so they can be tested without rendering.
// The bar shows today's share of what counts (rules/energy.ts): "Today" and a percentage, with tick
// marks at the B, A, and S cutoffs. 100% means 3 stars on everything counted (decided 2026-10-19).

import { tuning } from '@/config/tuning';

/** Where the tick marks stand, 0 to 1: the B, A, and S rank cutoffs, lowest first. */
export function tickPositions(): number[] {
  const { B, A, S } = tuning.rank.cutoffs;
  return [B, A, S];
}

/** The top tick, which gets the shimmer when the fill crosses it. */
function topTick(): number {
  return tuning.rank.cutoffs.S;
}

/** Clamp a fill value to the bar. */
export function clampEnergy(energy: number): number {
  return Math.min(1, Math.max(0, energy));
}

/** Whole percent shown on screen: "64%". */
export function percentText(fill: number): string {
  return `${Math.round(clampEnergy(fill) * 100)}%`;
}

/** What a screen reader hears: "64 percent of today. Marks at 50, 75, and 90 percent." */
export function energyLabel(fill: number, isRestDay: boolean): string {
  if (isRestDay) return 'Rest day, no habits due';
  const [b, a, s] = tickPositions().map((t) => Math.round(t * 100));
  return `${Math.round(clampEnergy(fill) * 100)} percent of today. Marks at ${b}, ${a}, and ${s} percent.`;
}

export type EnergyMilestone = 'top' | 'full';

/**
 * Which celebration a fill change earns: reaching 100% beats crossing the top tick. Only upward
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
  const top = topTick();
  if (next >= top && previous < top) return 'top';
  return null;
}
