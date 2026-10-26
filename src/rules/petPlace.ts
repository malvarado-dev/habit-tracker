// Where the pet is in the living room and how it's drawn (P2-12, #83; PRD-09).
// Before the first habit log of the day it sleeps in its bed, or hides behind the bed if
// Confidence is under 10. The first log wakes it and it moves to its Confidence spot.
// Slips and Skips never wake it. Undoing the day's only log puts it back to sleep.

import { tuning } from '@/config/tuning';
import type { DateKey } from '@/rules/dates';
import type { LogCounts } from '@/rules/habits';
import type { PetSpot } from '@/scene/roomGeometry';

/** Where the pet is drawn against the bed's two layers. */
export type PetLayer = 'behindBed' | 'inBed' | 'front';

export type PetPlace = { spot: PetSpot; layer: PetLayer };

type Thresholds = { hideBelow: number; restUpTo: number };

export function petPlace(
  confidence: number,
  loggedToday: boolean,
  t: Thresholds = tuning.pet,
): PetPlace {
  if (confidence < t.hideBelow) return { spot: 'hide', layer: 'behindBed' };
  if (!loggedToday) return { spot: 'bed', layer: 'inBed' };
  if (confidence <= t.restUpTo) return { spot: 'bedAwake', layer: 'inBed' };
  return { spot: 'room', layer: 'front' };
}

/** True once any good habit has a log on this day. Slips live elsewhere, so they never count. */
export function hasHabitLog(log: LogCounts, date: DateKey): boolean {
  return Object.values(log[date] ?? {}).some((n) => n > 0);
}
