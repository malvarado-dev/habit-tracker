// How bright the sky is. It mirrors the live rank without ever showing a letter (SPEC-00).

import { getRank, type Mode, type Rank } from './rank';
import type { DailyResult } from './scoring';

/** 'asleep' before the first check-in of the day; 'rest' on a Rest day; otherwise the live rank. */
export type SkyLevel = 'asleep' | 'rest' | Rank;

export function getSkyLevel(result: DailyResult, mode: Mode): SkyLevel {
  if (result.isRestDay) return 'rest';
  if (result.checkedInCount === 0 || result.score === null) return 'asleep';
  return getRank(result.score, mode);
}

/** The sun is out from 6 AM until 6 PM; the moon the rest of the time. */
export function isDaytime(hour: number): boolean {
  return hour >= 6 && hour < 18;
}
