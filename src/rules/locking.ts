// Locking days (SPEC-00, T16). Today and the 2 days before can be changed. A day older than that
// locks, and its result is saved for good: rank, Rest day, or no check-in, plus stars. Editing,
// renaming, or removing a habit later never changes a locked day. Plain TypeScript, no screens.

import { calendar } from '@/config/calendar';
import { addDays, type DateKey } from './dates';
import { getRank, type Rank } from './rank';
import { getDailyResult, type CheckInLog, type Habit } from './scoring';

export type DayOutcome = 'rank' | 'rest' | 'none';

/** A day's result, frozen when it locks. */
export interface LockedDay {
  outcome: DayOutcome;
  /** Set only when outcome is 'rank'. */
  rank?: Rank;
  earnedStars: number;
  possibleStars: number;
}

/** The newest day that is locked when it's `today`. Every day up to and including it is locked. */
export function lastLockedDay(today: DateKey): DateKey {
  return addDays(today, -(calendar.openDaysBeforeToday + 1));
}

/** True if a day can't change any more. */
export function isLocked(date: DateKey, lockedThrough: DateKey | null): boolean {
  return lockedThrough !== null && date <= lockedThrough;
}

/** A day's result from the live rules. Used for open days and when a day locks. */
export function dayResult(habits: Habit[], log: CheckInLog, date: DateKey): LockedDay {
  const result = getDailyResult(habits, log, date);
  const base = { earnedStars: result.earnedStars, possibleStars: result.possibleStars };
  if (!result.hasCheckIn) return { outcome: 'none', ...base };
  if (result.score === null) return { outcome: 'rest', ...base };
  return { outcome: 'rank', rank: getRank(result.score), ...base };
}

export interface LockState {
  habits: Habit[];
  log: CheckInLog;
  locked: Record<DateKey, LockedDay>;
  lockedThrough: DateKey | null;
}

/**
 * Locks every day older than the open window. Each day with check-ins gets its result saved;
 * a day with none stays blank. Runs oldest first, and never touches a day that's already locked.
 * Returns the same object when nothing changes.
 */
export function lockDays<S extends LockState>(state: S, today: DateKey): S {
  const through = lastLockedDay(today);
  if (state.lockedThrough !== null && state.lockedThrough >= through) return state;

  const newlyLocked = Object.keys(state.log)
    .filter((date) => date <= through && !isLocked(date, state.lockedThrough))
    .sort();

  const locked = { ...state.locked };
  for (const date of newlyLocked) {
    if (locked[date]) continue;
    const result = dayResult(state.habits, state.log, date);
    if (result.outcome !== 'none') locked[date] = result;
  }
  return { ...state, locked, lockedThrough: through };
}

/** A day's result for History: the saved one if locked, else live from today's rules. */
export function historyDay(state: LockState, date: DateKey): LockedDay {
  if (isLocked(date, state.lockedThrough)) {
    return state.locked[date] ?? { outcome: 'none', earnedStars: 0, possibleStars: 0 };
  }
  return dayResult(state.habits, state.log, date);
}
