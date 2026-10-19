// Everything the prototype remembers, and every way it can change. A plain reducer:
// given the current state and an action, it returns the next state. No screens here,
// so it's easy to test.

import type { DateKey } from '@/rules/dates';
import { isLocked, lockDays, type LockedDay } from '@/rules/locking';
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
import { cleanName, nameProblem } from '@/features/habits/habitName';

export interface TrackerState {
  /** Bumped when the saved shape changes. Older saves are upgraded step by step (save.ts). */
  version: 7;
  /** Active habits, in card order. */
  habits: Habit[];
  /** Removed habits, each with the day it was removed, so their active days still score (T21). */
  removed: Habit[];
  log: CheckInLog;
  /** Results saved for good when each day locked (T16). Days with no check-in have no entry. */
  locked: Record<DateKey, LockedDay>;
  /** Every day up to and including this one is locked. Null until the first lock. */
  lockedThrough: DateKey | null;
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

/** At most 15 habits (Glossary). */
export const MAX_HABITS = 15;

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

/**
 * A fresh start. `addedOn` is the tracker's own date (Test uses its pretend date), so the starter
 * habits get a scaled first week (#52). Left out, they keep full goals.
 */
export function createInitialState(addedOn?: DateKey): TrackerState {
  return {
    version: 7,
    removed: [],
    habits: addedOn ? DEFAULT_HABITS.map((h) => ({ ...h, addedOn })) : DEFAULT_HABITS,
    log: {},
    locked: {},
    lockedThrough: null,
  };
}

export type TrackerAction =
  | { type: 'tapHabit'; date: DateKey; habitId: string }
  | { type: 'setCheckIn'; date: DateKey; habitId: string; checkIn: CheckIn | undefined }
  | { type: 'addHabit'; id: string; name: string; goal?: WeeklyGoal; date: DateKey }
  | { type: 'renameHabit'; habitId: string; name: string }
  | { type: 'setGoal'; habitId: string; goal: WeeklyGoal }
  | { type: 'removeHabit'; habitId: string; date: DateKey }
  | { type: 'restoreHabit'; habit: Habit; index: number }
  | { type: 'lockDays'; today: DateKey; openDays?: number };

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
      // A locked day never changes (T16). The screens turn taps off too; this is the backstop.
      if (isLocked(action.date, state.lockedThrough)) return state;
      const current = state.log[action.date]?.[action.habitId];
      return withCheckIn(state, action.date, action.habitId, nextCheckIn(current));
    }
    case 'setCheckIn':
      if (isLocked(action.date, state.lockedThrough)) return state;
      return withCheckIn(state, action.date, action.habitId, action.checkIn);
    case 'addHabit': {
      // Name rules (habitName.ts): never blank, never a duplicate, at most 20 characters.
      if (nameProblem(action.name, state.habits)) return state;
      if (state.habits.length >= MAX_HABITS) return state;
      if (state.habits.some((h) => h.id === action.id)) return state;
      const goal = (action.goal && cleanGoal(action.goal)) ?? {
        kind: 'specificDays',
        days: EVERY_DAY,
      };
      return {
        ...state,
        habits: [
          ...state.habits,
          {
            id: action.id,
            name: cleanName(action.name),
            goal,
            color: leastUsedColor(state.habits),
            // Its first week is scaled to the days left from here (#52).
            addedOn: action.date,
          },
        ],
      };
    }
    case 'renameHabit':
      // Only valid names save. While the field is blank or a duplicate, the habit keeps
      // its last valid name and the screen shows a hint.
      if (nameProblem(action.name, state.habits, action.habitId)) return state;
      return updateHabit(state, action.habitId, { name: cleanName(action.name) });
    case 'setGoal': {
      const goal = cleanGoal(action.goal);
      return goal ? updateHabit(state, action.habitId, { goal }) : state;
    }
    case 'removeHabit': {
      // At least one habit always stays (Glossary).
      if (state.habits.length <= 1) return state;
      const habit = state.habits.find((h) => h.id === action.habitId);
      if (!habit) return state;
      const habits = state.habits.filter((h) => h.id !== action.habitId);
      // It stops counting from the day it was removed (T21). Earlier days keep scoring it.
      // Removed the same day it was added: it was never active on a full day, so drop it.
      const removedOn = action.date;
      const neverActive = habit.addedOn !== undefined && habit.addedOn >= removedOn;
      const removed = neverActive ? state.removed : [...state.removed, { ...habit, removedOn }];
      return { ...state, habits, removed };
    }
    case 'restoreHabit': {
      // Undo after Remove. Check-ins were never deleted, so the habit comes back with its history.
      if (state.habits.some((h) => h.id === action.habit.id)) return state;
      if (state.habits.length >= MAX_HABITS) return state;
      const { removedOn: _removedOn, ...restored } = action.habit;
      const habits = [...state.habits];
      habits.splice(Math.min(Math.max(action.index, 0), habits.length), 0, restored);
      const removed = state.removed.filter((h) => h.id !== action.habit.id);
      return { ...state, habits, removed };
    }
    case 'lockDays':
      return lockDays(state, action.today, action.openDays);
  }
}
