// How bright the sky is on the wide layout's Prototype 1 scene. Ranks are gone (P2-08a), so it
// follows the Activity Bar instead: asleep before the first log, awake once logging starts, full
// once the bar fills, and calm on a Rest day.

import type { ActivityBarResult } from './activityBar';
import type { LockedDay } from './locking';
import { tuning } from '@/config/tuning';

export type SkyLevel = 'asleep' | 'rest' | 'awake' | 'full';

export function getSkyLevel(bar: ActivityBarResult): SkyLevel {
  if (bar.isRestDay) return 'rest';
  if (bar.isFull) return 'full';
  return bar.logs > 0 ? 'awake' : 'asleep';
}

/** The Day screen's sky, from the same result History shows (the saved one once locked). */
export function sceneLevel(day: LockedDay): SkyLevel {
  if (day.outcome === 'rest') return 'rest';
  if (day.outcome === 'checkIn') return 'full';
  return day.logs > 0 ? 'awake' : 'asleep';
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
