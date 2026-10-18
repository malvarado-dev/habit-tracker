// Everything the prototype remembers, and every way it can change. A plain reducer:
// given the current state and an action, it returns the next state. No screens here,
// so it's easy to test.

import type { DateKey } from '@/rules/dates';
import { DEFAULT_MODE, type Mode } from '@/rules/rank';
import { nextCheckIn, type CheckIn, type CheckInLog, type Habit } from '@/rules/scoring';

export interface TrackerState {
  /** Bumped when the saved shape changes, so old saves can be thrown away safely. */
  version: 1;
  habits: Habit[];
  mode: Mode;
  log: CheckInLog;
  /** The mode each finished day was played in. Past days keep their mode (SPEC-00). */
  dayModes: Record<DateKey, Mode>;
  /** True once the first check-in has hatched the egg. */
  hatched: boolean;
  /** Test tools only: how many days ahead of the real date the app is pretending to be. */
  dayOffset: number;
}

export const DEFAULT_HABITS: Habit[] = [
  { id: 'sleep', name: 'Sleep', weeklyTarget: 7 },
  { id: 'diet', name: 'Diet', weeklyTarget: 7 },
  { id: 'exercise', name: 'Exercise', weeklyTarget: 3 },
  { id: 'wellbeing', name: 'Wellbeing', weeklyTarget: 7 },
];

export const MIN_TARGET = 1;
export const MAX_TARGET = 7;

export function createInitialState(): TrackerState {
  return {
    version: 1,
    habits: DEFAULT_HABITS,
    mode: DEFAULT_MODE,
    log: {},
    dayModes: {},
    hatched: false,
    dayOffset: 0,
  };
}

export type TrackerAction =
  | { type: 'tapHabit'; date: DateKey; habitId: string }
  | { type: 'setCheckIn'; date: DateKey; habitId: string; checkIn: CheckIn }
  | { type: 'setMode'; mode: Mode }
  | { type: 'nextDay'; today: DateKey }
  | { type: 'addHabit'; id: string; name: string }
  | { type: 'renameHabit'; habitId: string; name: string }
  | { type: 'setWeeklyTarget'; habitId: string; weeklyTarget: number }
  | { type: 'removeHabit'; habitId: string }
  | { type: 'reset' };

function withCheckIn(
  state: TrackerState,
  date: DateKey,
  habitId: string,
  checkIn: CheckIn,
): TrackerState {
  return {
    ...state,
    hatched: true, // the first check-in of any kind hatches the egg
    log: { ...state.log, [date]: { ...state.log[date], [habitId]: checkIn } },
  };
}

function updateHabit(state: TrackerState, habitId: string, change: Partial<Habit>): TrackerState {
  return {
    ...state,
    habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, ...change } : habit)),
  };
}

export function trackerReducer(state: TrackerState, action: TrackerAction): TrackerState {
  switch (action.type) {
    case 'tapHabit': {
      const current = state.log[action.date]?.[action.habitId];
      return withCheckIn(state, action.date, action.habitId, nextCheckIn(current));
    }
    case 'setCheckIn':
      return withCheckIn(state, action.date, action.habitId, action.checkIn);
    case 'setMode':
      return { ...state, mode: action.mode };
    case 'nextDay':
      return {
        ...state,
        dayModes: { ...state.dayModes, [action.today]: state.mode },
        dayOffset: state.dayOffset + 1,
      };
    case 'addHabit': {
      const name = action.name.trim();
      if (!name) return state;
      return { ...state, habits: [...state.habits, { id: action.id, name, weeklyTarget: 7 }] };
    }
    case 'renameHabit':
      // Empty names are allowed while typing; the screen shows a hint instead of blocking.
      return updateHabit(state, action.habitId, { name: action.name });
    case 'setWeeklyTarget': {
      const weeklyTarget = Math.min(MAX_TARGET, Math.max(MIN_TARGET, action.weeklyTarget));
      return updateHabit(state, action.habitId, { weeklyTarget });
    }
    case 'removeHabit':
      // At least one habit always stays (Glossary).
      if (state.habits.length <= 1) return state;
      return { ...state, habits: state.habits.filter((habit) => habit.id !== action.habitId) };
    case 'reset':
      return createInitialState();
  }
}

/** Accepts a saved state only if it has the shape this version expects. */
export function isTrackerState(value: unknown): value is TrackerState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<TrackerState>;
  return (
    v.version === 1 &&
    Array.isArray(v.habits) &&
    typeof v.mode === 'string' &&
    typeof v.log === 'object' &&
    typeof v.dayOffset === 'number'
  );
}
