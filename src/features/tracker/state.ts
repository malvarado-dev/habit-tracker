// Everything the prototype remembers, and every way it can change. A plain reducer:
// given the current state and an action, it returns the next state. No screens here,
// so it's easy to test.

import type { DateKey } from '@/rules/dates';
import {
  EVERY_DAY,
  nextCheckIn,
  type CheckIn,
  HABIT_COLORS,
  type CheckInLog,
  type Habit,
  type HabitColor,
  type WeeklyGoal,
  type Weekday,
} from '@/rules/scoring';

export interface TrackerState {
  /** Bumped when the saved shape changes, so old saves can be thrown away safely. */
  version: 3;
  habits: Habit[];
  log: CheckInLog;
  /** Test tools only: how many days ahead of the real date the app is pretending to be. */
  dayOffset: number;
}

export const DEFAULT_HABITS: Habit[] = [
  { id: 'sleep', name: 'Sleep', goal: { kind: 'specificDays', days: EVERY_DAY }, color: 'habit1' },
  { id: 'diet', name: 'Diet', goal: { kind: 'specificDays', days: EVERY_DAY }, color: 'habit3' },
  { id: 'exercise', name: 'Exercise', goal: { kind: 'anyDays', timesPerWeek: 3 }, color: 'habit5' },
  {
    id: 'wellbeing',
    name: 'Wellbeing',
    goal: { kind: 'specificDays', days: EVERY_DAY },
    color: 'habit6',
  },
];

/** A new habit gets the least-used habit color; ties go to the earliest in the palette. */
export function leastUsedColor(habits: Habit[]): HabitColor {
  const uses = (color: HabitColor) => habits.filter((h) => h.color === color).length;
  return HABIT_COLORS.reduce((best, color) => (uses(color) < uses(best) ? color : best));
}

export const MIN_TIMES = 1;
export const MAX_TIMES = 7;

/** Keeps a goal valid: Specific days needs at least 1 day; Any days is 1 to 7 times. */
export function cleanGoal(goal: WeeklyGoal): WeeklyGoal | null {
  if (goal.kind === 'anyDays') {
    const times = Math.round(goal.timesPerWeek);
    return { kind: 'anyDays', timesPerWeek: Math.min(MAX_TIMES, Math.max(MIN_TIMES, times)) };
  }
  const days = [...new Set(goal.days)].filter((d) => d >= 0 && d <= 6).sort() as Weekday[];
  return days.length === 0 ? null : { kind: 'specificDays', days };
}

export function createInitialState(): TrackerState {
  return {
    version: 3,
    habits: DEFAULT_HABITS,
    log: {},
    dayOffset: 0,
  };
}

export type TrackerAction =
  | { type: 'tapHabit'; date: DateKey; habitId: string }
  | { type: 'setCheckIn'; date: DateKey; habitId: string; checkIn: CheckIn | undefined }
  | { type: 'nextDay' }
  | { type: 'addHabit'; id: string; name: string }
  | { type: 'renameHabit'; habitId: string; name: string }
  | { type: 'setGoal'; habitId: string; goal: WeeklyGoal }
  | { type: 'removeHabit'; habitId: string }
  | { type: 'reset' };

function withCheckIn(
  state: TrackerState,
  date: DateKey,
  habitId: string,
  checkIn: CheckIn | undefined,
): TrackerState {
  const day = { ...state.log[date] };
  if (checkIn === undefined)
    delete day[habitId]; // back to To do
  else day[habitId] = checkIn;
  return { ...state, log: { ...state.log, [date]: day } };
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
    case 'nextDay':
      return { ...state, dayOffset: state.dayOffset + 1 };
    case 'addHabit': {
      const name = action.name.trim();
      if (!name) return state;
      return {
        ...state,
        habits: [
          ...state.habits,
          {
            id: action.id,
            name,
            goal: { kind: 'specificDays', days: EVERY_DAY },
            color: leastUsedColor(state.habits),
          },
        ],
      };
    }
    case 'renameHabit':
      // Empty names are allowed while typing; the screen shows a hint instead of blocking.
      return updateHabit(state, action.habitId, { name: action.name });
    case 'setGoal': {
      const goal = cleanGoal(action.goal);
      return goal ? updateHabit(state, action.habitId, { goal }) : state;
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
    v.version === 3 &&
    Array.isArray(v.habits) &&
    typeof v.log === 'object' &&
    typeof v.dayOffset === 'number'
  );
}
