// Which habits already showed "Weekly goal met" today, for as long as the app is running (T18:
// once per habit per app session for that day). In memory only, never saved, so reopening the
// app starts fresh.

import type { DateKey } from '@/rules/dates';

const shown = new Set<string>();

/** True the first time for this habit on this date in this session; false after that. */
export function claimGoalMet(habitId: string, date: DateKey): boolean {
  const key = `${date}:${habitId}`;
  if (shown.has(key)) return false;
  shown.add(key);
  return true;
}

/** Tests only: start a new session. */
export function resetGoalMetSession(): void {
  shown.clear();
}
