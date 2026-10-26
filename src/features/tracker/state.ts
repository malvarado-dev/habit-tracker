// Everything the prototype remembers, and every way it can change. A plain reducer:
// given the current state and an action, it returns the next state. No screens here,
// so it's easy to test.

import { dayTarget } from '@/rules/activityBar';
import type { DateKey } from '@/rules/dates';
import {
  cleanTimesPerDay,
  EVERY_DAY,
  existsOn,
  HABIT_COLORS,
  logCount,
  timesPerDay,
  type Habit,
  type HabitColor,
  type LogCounts,
  type Schedule,
  type Weekday,
} from '@/rules/habits';
import { cleanCount, slipCount, type BadHabit, type SlipCounts } from '@/rules/badHabits';
import { allHabits, isLocked, lockDays, type LockedDay } from '@/rules/locking';
import { tuning } from '@/config/tuning';
import { cleanName, nameProblem } from '@/features/habits/habitName';

export interface TrackerState {
  /** Bumped when the saved shape changes. Older saves are upgraded step by step (save.ts). */
  version: 10;
  /** The pet's own values (Prototype 2). Confidence picks its spot in the room (P2-12). */
  pet: PetState;
  /** Active habits, in card order. */
  habits: Habit[];
  /** Removed habits, each with the day it was removed, so their active days still score (T21). */
  removed: Habit[];
  /** Logs per habit per day (P2-08a). */
  log: LogCounts;
  /**
   * Each day's Activity Bar target, saved on the first open of the day so habits added or
   * removed later that day never move it (PRD-14).
   */
  targets: Record<DateKey, number>;
  /** Bad habits (P2-09), in the order they were added. */
  badHabits: BadHabit[];
  /**
   * Slips per bad habit per day. Kept apart from `log` so slips never earn Activity Bar
   * progress (PRD-15).
   */
  slips: SlipCounts;
  /** Results saved for good when each day locked (T16). Days with no check-in have no entry. */
  locked: Record<DateKey, LockedDay>;
  /** Every day up to and including this one is locked. Null until the first lock. */
  lockedThrough: DateKey | null;
}

export interface PetState {
  /** 0 to 100. */
  confidence: number;
}

export const MIN_CONFIDENCE = 0;
export const MAX_CONFIDENCE = 100;

/** Keeps Confidence a whole number from 0 to 100. */
export function cleanConfidence(value: number): number {
  if (!Number.isFinite(value)) return tuning.pet.startConfidence;
  return Math.min(MAX_CONFIDENCE, Math.max(MIN_CONFIDENCE, Math.round(value)));
}

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'sleep',
    name: 'Sleep',
    schedule: { kind: 'specificDays', days: EVERY_DAY },
    color: 'habit1',
  },
  {
    id: 'diet',
    name: 'Diet',
    schedule: { kind: 'specificDays', days: EVERY_DAY },
    color: 'habit3',
  },
  { id: 'exercise', name: 'Exercise', schedule: { kind: 'anyDays' }, color: 'habit5' },
  {
    id: 'wellbeing',
    name: 'Wellbeing',
    schedule: { kind: 'specificDays', days: EVERY_DAY },
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

/** Keeps a schedule valid: Specific days needs at least 1 day. */
export function cleanSchedule(schedule: Schedule): Schedule | null {
  if (schedule.kind === 'anyDays') return { kind: 'anyDays' };
  const days = [...new Set(schedule.days)].filter((d) => d >= 0 && d <= 6).sort() as Weekday[];
  return days.length === 0 ? null : { kind: 'specificDays', days };
}

/** A fresh start. `addedOn` is the tracker's own date (Test uses its pretend date). */
export function createInitialState(addedOn?: DateKey): TrackerState {
  return {
    version: 10,
    pet: { confidence: tuning.pet.startConfidence },
    removed: [],
    habits: addedOn ? DEFAULT_HABITS.map((h) => ({ ...h, addedOn })) : DEFAULT_HABITS,
    log: {},
    targets: {},
    badHabits: [],
    slips: {},
    locked: {},
    lockedThrough: null,
  };
}

/** At most this many bad habits, the same cap as good habits. */
export const MAX_BAD_HABITS = 15;

export type TrackerAction =
  /** One tap on a card: one more log, up to the habit's times per day. */
  | { type: 'logHabit'; date: DateKey; habitId: string }
  /** The Undo bar: takes the last log back. */
  | { type: 'undoLog'; date: DateKey; habitId: string }
  | { type: 'addHabit'; id: string; name: string; schedule?: Schedule; date: DateKey }
  | { type: 'renameHabit'; habitId: string; name: string }
  | { type: 'setSchedule'; habitId: string; schedule: Schedule }
  /** Test tools for now (P2-08a): how many logs finish the habit today, 1 to the max. */
  | { type: 'setTimesPerDay'; habitId: string; times: number }
  | { type: 'removeHabit'; habitId: string; date: DateKey }
  | { type: 'restoreHabit'; habit: Habit; index: number }
  | { type: 'lockDays'; today: DateKey; openDays?: number }
  /** Test tools: finishes every habit that exists on the day. Locked days never change. */
  | { type: 'fillDay'; date: DateKey }
  /** Test tools: sets the pet's Confidence (clamped to 0 to 100). */
  | { type: 'setConfidence'; value: number }
  /** Add habit (P2-09): a bad habit, standalone or paired with one good habit. */
  | { type: 'addBadHabit'; id: string; name: string; pairedWith?: string; date: DateKey }
  /** Tray tap: one more slip. */
  | { type: 'logSlip'; date: DateKey; badHabitId: string }
  /** Tray stepper and Undo: sets the day's count (never below 0). */
  | { type: 'setSlips'; date: DateKey; badHabitId: string; count: number };

/**
 * Saves the day's Activity Bar target the first time the day is seen, from the habits active at
 * that moment. Later adds and removes that day leave it alone (PRD-14).
 */
export function withTarget(state: TrackerState, date: DateKey): TrackerState {
  if (state.targets[date] !== undefined || isLocked(date, state.lockedThrough)) return state;
  const target = dayTarget(allHabits(state), date);
  return { ...state, targets: { ...state.targets, [date]: target } };
}

function withCount(state: TrackerState, date: DateKey, habitId: string, count: number) {
  const day = { ...state.log[date] };
  if (count <= 0) delete day[habitId];
  else day[habitId] = count;
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
    case 'logHabit': {
      // A locked day never changes (T16). The screens turn taps off too; this is the backstop.
      if (isLocked(action.date, state.lockedThrough)) return state;
      const habit = allHabits(state).find((h) => h.id === action.habitId);
      if (!habit || !existsOn(habit, action.date)) return state;
      const count = logCount(state.log, action.date, action.habitId);
      // A finished habit takes no more logs.
      if (count >= timesPerDay(habit)) return state;
      return withCount(withTarget(state, action.date), action.date, action.habitId, count + 1);
    }
    case 'undoLog': {
      if (isLocked(action.date, state.lockedThrough)) return state;
      const count = logCount(state.log, action.date, action.habitId);
      if (count <= 0) return state;
      return withCount(state, action.date, action.habitId, count - 1);
    }
    case 'addHabit': {
      // Name rules (habitName.ts): never blank, never a duplicate, at most 20 characters.
      if (nameProblem(action.name, [...state.habits, ...state.badHabits])) return state;
      if (state.habits.length >= MAX_HABITS) return state;
      if (state.habits.some((h) => h.id === action.id)) return state;
      const schedule = (action.schedule && cleanSchedule(action.schedule)) ?? {
        kind: 'specificDays',
        days: EVERY_DAY,
      };
      // Save today's target first, so a habit added today is a bonus (PRD-14).
      const before = withTarget(state, action.date);
      return {
        ...before,
        habits: [
          ...before.habits,
          {
            id: action.id,
            name: cleanName(action.name),
            schedule,
            color: leastUsedColor(before.habits),
            addedOn: action.date,
          },
        ],
      };
    }
    case 'renameHabit':
      // Only valid names save. While the field is blank or a duplicate, the habit keeps
      // its last valid name and the screen shows a hint.
      if (nameProblem(action.name, [...state.habits, ...state.badHabits], action.habitId))
        return state;
      return updateHabit(state, action.habitId, { name: cleanName(action.name) });
    case 'setSchedule': {
      const schedule = cleanSchedule(action.schedule);
      return schedule ? updateHabit(state, action.habitId, { schedule }) : state;
    }
    case 'setTimesPerDay': {
      const habit = state.habits.find((h) => h.id === action.habitId);
      const times = cleanTimesPerDay(action.times);
      if (!habit || timesPerDay(habit) === times) return state;
      return updateHabit(state, action.habitId, { timesPerDay: times });
    }
    case 'removeHabit': {
      // At least one habit always stays (Glossary).
      if (state.habits.length <= 1) return state;
      const habit = state.habits.find((h) => h.id === action.habitId);
      if (!habit) return state;
      const habits = state.habits.filter((h) => h.id !== action.habitId);
      // It stops counting from the day it was removed (T21). Earlier days keep counting it, and
      // today's target was saved before it went, so removing it never moves the finish line.
      // Removed the same day it was added: it was never active on a full day, so drop it.
      const before = withTarget(state, action.date);
      const removedOn = action.date;
      const neverActive = habit.addedOn !== undefined && habit.addedOn >= removedOn;
      const removed = neverActive ? before.removed : [...before.removed, { ...habit, removedOn }];
      return { ...before, habits, removed };
    }
    case 'restoreHabit': {
      // Undo after Remove. Logs were never deleted, so the habit comes back with its history.
      if (state.habits.some((h) => h.id === action.habit.id)) return state;
      if (state.habits.length >= MAX_HABITS) return state;
      const { removedOn: _removedOn, ...restored } = action.habit;
      const habits = [...state.habits];
      habits.splice(Math.min(Math.max(action.index, 0), habits.length), 0, restored);
      const removed = state.removed.filter((h) => h.id !== action.habit.id);
      return { ...state, habits, removed };
    }
    case 'lockDays':
      // Runs on every open and every minute, so it's also where today's target gets saved.
      return withTarget(lockDays(state, action.today, action.openDays), action.today);
    case 'fillDay': {
      if (isLocked(action.date, state.lockedThrough)) return state;
      const withDay = withTarget(state, action.date);
      const day = { ...withDay.log[action.date] };
      let changed = false;
      for (const habit of withDay.habits) {
        if (!existsOn(habit, action.date) || (day[habit.id] ?? 0) >= timesPerDay(habit)) continue;
        day[habit.id] = timesPerDay(habit);
        changed = true;
      }
      return changed ? { ...withDay, log: { ...withDay.log, [action.date]: day } } : state;
    }
    case 'addBadHabit': {
      const all = [...state.habits, ...state.badHabits];
      if (nameProblem(action.name, all)) return state;
      if (state.badHabits.length >= MAX_BAD_HABITS) return state;
      if (state.badHabits.some((b) => b.id === action.id)) return state;
      // A pairing only sticks to a good habit the user has.
      const paired = state.habits.some((h) => h.id === action.pairedWith);
      const bad: BadHabit = {
        id: action.id,
        name: cleanName(action.name),
        addedOn: action.date,
        ...(paired ? { pairedWith: action.pairedWith } : {}),
      };
      return { ...state, badHabits: [...state.badHabits, bad] };
    }
    case 'logSlip':
    case 'setSlips': {
      if (isLocked(action.date, state.lockedThrough)) return state;
      if (!state.badHabits.some((b) => b.id === action.badHabitId)) return state;
      const current = slipCount(state.slips, action.date, action.badHabitId);
      const next = action.type === 'logSlip' ? current + 1 : cleanCount(action.count);
      if (next === current) return state;
      const day = { ...state.slips[action.date] };
      if (next === 0) delete day[action.badHabitId];
      else day[action.badHabitId] = next;
      return { ...state, slips: { ...state.slips, [action.date]: day } };
    }
    case 'setConfidence': {
      const confidence = cleanConfidence(action.value);
      return confidence === state.pet.confidence ? state : { ...state, pet: { confidence } };
    }
  }
}
