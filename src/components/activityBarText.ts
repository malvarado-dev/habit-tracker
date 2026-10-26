// Activity Bar words and math, kept apart from the component so they can be tested without
// rendering. The bar shows counted logs against today's target (rules/activityBar.ts), with 3
// notches. The full-bar celebration plays once each time the fill reaches the end.

import { tuning } from '@/config/tuning';

/** Where the notches stand, 0 to 1, lowest first. */
export function notchPositions(): readonly number[] {
  return tuning.activityBar.notches;
}

/** Clamp a fill value to the bar. */
export function clampFill(fill: number): number {
  return Math.min(1, Math.max(0, fill));
}

/** What a screen reader hears: "3 of 5 logs today", "Full, 5 of 5 logs today", "Rest day". */
export function activityBarLabel(
  logs: number,
  target: number,
  isRestDay: boolean,
  day: string = 'today',
): string {
  if (isRestDay) return 'Rest day, no habits to log';
  const shown = Math.min(logs, target);
  const counted = `${shown} of ${target} ${target === 1 ? 'log' : 'logs'} ${day}`;
  return logs >= target ? `Activity Bar full, ${counted}` : `Activity Bar, ${counted}`;
}

/**
 * The bar just filled: only on an upward move to full, so opening the app never celebrates, and
 * an undo below full followed by another log celebrates again. A Rest day is full without earning
 * anything, so it never celebrates.
 */
export function justFilled(previous: number, next: number, isRestDay: boolean): boolean {
  return !isRestDay && next >= 1 && previous < 1;
}

/** A small seeded random, so sparkles look varied but tests stay predictable. */
export function seeded(seed: number): () => number {
  let x = seed % 2147483647 || 1;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}
