// How bright the sky is. It mirrors the live rank without ever showing a letter (SPEC-00).

import type { LockedDay } from './locking';
import { getRank, type Rank } from './rank';
import type { DailyResult } from './scoring';
import { tuning } from '@/config/tuning';

/** 'asleep' before the first check-in of the day; 'rest' on a Rest day; otherwise the live rank. */
export type SkyLevel = 'asleep' | 'rest' | Rank;

export function getSkyLevel(result: DailyResult): SkyLevel {
  if (result.isRestDay) return 'rest';
  if (!result.hasCheckIn || result.score === null) return 'asleep';
  return getRank(result.score);
}

/**
 * The Day screen's sky and critter (T23), from the same result History shows: the saved one on a
 * locked day, the live one on an open day. No check-in is a quiet sky with the critter asleep.
 */
export function sceneLevel(day: LockedDay): SkyLevel {
  if (day.outcome === 'rest') return 'rest';
  if (day.outcome === 'rank' && day.rank) return day.rank;
  return 'asleep';
}

/** Which sky the Background shows (background.md). Time of day only, never the theme. */
export type SkyTime = 'day' | 'dusk' | 'night';

/** Day from dayStartHour, dusk from duskStartHour, night from nightStartHour (tuning file). */
export function getSkyTime(hour: number): SkyTime {
  const { dayStartHour, duskStartHour, nightStartHour } = tuning.sky;
  if (hour >= dayStartHour && hour < duskStartHour) return 'day';
  if (hour >= duskStartHour && hour < nightStartHour) return 'dusk';
  return 'night';
}

/**
 * Status bar icons sit on the Background, so they follow the sky, not the theme:
 * dark icons on the day sky, light icons at dusk and night (background.md).
 */
export function statusBarStyle(time: SkyTime): 'dark' | 'light' {
  return time === 'day' ? 'dark' : 'light';
}
