// Locking days (SPEC-00, T16). Today and the 2 days before can be changed. A day older than that
// locks, and its result is saved for good: Check-in (the Activity Bar filled), Rest day, or no
// check-in, plus its logs and target. Editing, renaming, or removing a habit later never changes a
// locked day. Plain TypeScript, no screens.

import { calendar } from '@/config/calendar';
import { getActivityBar } from './activityBar';
import { addDays, type DateKey } from './dates';
import type { Habit, LogCounts } from './habits';

/** checkIn: the Activity Bar filled. rest: nothing to log. none: logged too little, or nothing. */
export type DayOutcome = 'checkIn' | 'rest' | 'none';

/** A day's result, frozen when it locks. */
export interface LockedDay {
  outcome: DayOutcome;
  /** Counted logs that day. */
  logs: number;
  /** Logs that filled the bar. 0 on a Rest day. */
  target: number;
}

/** The newest day that is locked when it's `today`. Every day up to and including it is locked. */
export function lastLockedDay(
  today: DateKey,
  openDays: number = calendar.openDaysBeforeToday,
): DateKey {
  return addDays(today, -(openDays + 1));
}

/** Every habit ever kept, active or removed. The rules check each one's dates (T21). */
export function allHabits(state: Pick<LockState, 'habits' | 'removed'>): Habit[] {
  return [...state.habits, ...state.removed];
}

/** True if a day can't change any more. */
export function isLocked(date: DateKey, lockedThrough: DateKey | null): boolean {
  return lockedThrough !== null && date <= lockedThrough;
}

/** A day's result from the live rules. Used for open days and when a day locks. */
export function dayResult(
  habits: Habit[],
  log: LogCounts,
  date: DateKey,
  savedTarget?: number,
): LockedDay {
  const bar = getActivityBar(habits, log, date, savedTarget);
  const base = { logs: bar.logs, target: bar.target };
  if (bar.isRestDay) return { outcome: 'rest', ...base };
  return { outcome: bar.isFull ? 'checkIn' : 'none', ...base };
}

export interface LockState {
  habits: Habit[];
  /** Removed habits, kept so the days they were active still count them (T21). */
  removed: Habit[];
  log: LogCounts;
  /** Each day's Activity Bar target, saved on the first open of that day. */
  targets: Record<DateKey, number>;
  locked: Record<DateKey, LockedDay>;
  lockedThrough: DateKey | null;
}

/**
 * Locks every day older than the open window. Each day with logs gets its result saved, and so
 * does a day opened as a Rest day (a saved target of 0). Any other day stays blank. Runs oldest first, and never touches a day that's already locked.
 * Returns the same object when nothing changes.
 */
export function lockDays<S extends LockState>(
  state: S,
  today: DateKey,
  openDays: number = calendar.openDaysBeforeToday,
): S {
  const through = lastLockedDay(today, openDays);
  if (state.lockedThrough !== null && state.lockedThrough >= through) return state;

  const newlyLocked = [...new Set([...Object.keys(state.log), ...Object.keys(state.targets)])]
    .filter((date) => date <= through && !isLocked(date, state.lockedThrough))
    .sort();

  const locked = { ...state.locked };
  for (const date of newlyLocked) {
    if (locked[date]) continue;
    const hasLogs = Object.values(state.log[date] ?? {}).some((n) => n > 0);
    if (!hasLogs && state.targets[date] !== 0) continue;
    locked[date] = dayResult(allHabits(state), state.log, date, state.targets[date]);
  }
  return { ...state, locked, lockedThrough: through };
}

/** A day's result for History: the saved one if locked, else live from today's rules. */
export function historyDay(state: LockState, date: DateKey): LockedDay {
  if (isLocked(date, state.lockedThrough)) {
    return state.locked[date] ?? { outcome: 'none', logs: 0, target: 0 };
  }
  return dayResult(allHabits(state), state.log, date, state.targets[date]);
}
