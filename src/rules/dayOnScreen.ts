// Which day a tap counts toward (P2-18a, #89). Logs count toward the day on screen: Today left
// open from 11:58 PM still logs to that day after midnight. Today moves to the new day when the
// app is opened or comes back from the background. If the day on screen has locked by then,
// the tap moves Today to the real day instead of logging.

import { addDays, type DateKey } from '@/rules/dates';

/** Day edits a stale screen can make. Adding or removing habits isn't a day edit. */
export const DAY_EDITS = new Set([
  'logHabit',
  'undoLog',
  'setHistoryLogs',
  'logSlip',
  'setSlips',
  'skipHabit',
  'unskipHabit',
]);

/** True when a tap on `date` must refresh Today instead, because that day can't change now. */
export function isStaleTap(date: DateKey, realToday: DateKey, openDays: number): boolean {
  return date < addDays(realToday, -openDays);
}
