// Calendar settings (SPEC-00). One week-start setting drives weekly goals, isDue, the progress
// ring and dots, and History. Following the phone's region is Later.

import type { Weekday } from '@/rules/scoring';

export const calendar = {
  /**
   * The day each week starts on, as a saved weekday number (Monday is 0, Sunday is 6).
   * Sunday since 2026-10-19 (US calendar). Saved habits keep their weekday numbers either way.
   */
  weekStartsOn: 6 as Weekday,

  /** Today and this many days before it can still be changed. Older days lock for good. */
  openDaysBeforeToday: 2,

  /**
   * Test mode only (T22): today and this many days before it can be changed, so History can be
   * filled in quickly. Older days can't be opened in Test. Real keeps openDaysBeforeToday.
   */
  testOpenDaysBeforeToday: 45,
} as const;
