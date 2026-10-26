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
import {
  cleanCount,
  slipCount,
  type BadHabit,
  type BadHabitDesign,
  type SlipCounts,
} from '@/rules/badHabits';
import { addToTally, habitsForDesign, timesFor, type DesignTallies } from '@/rules/design';
import { dayLogs, isSkipped, type Skips } from '@/rules/linked';
import { allHabits, isLocked, lockDays, type LockedDay } from '@/rules/locking';
import { adjustFor, type PetAdjust, type PetStat } from '@/rules/petStats';
import { cleanName, nameProblem } from '@/features/habits/habitName';

export interface TrackerState {
  /** Bumped when the saved shape changes. Older saves are upgraded step by step (save.ts). */
  version: 13;
  /** Test nudges to the pet's Love and Confidence (P2-13). Confidence picks its spot (P2-12). */
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
  /** Habits skipped for a day (P2-08b). Skip hides the card and changes nothing else. */
  skips: Skips;
  /**
   * Logs and slips per day, split by the bad habits design they were made in (P2-10). Playtest
   * data only: screens never read it, so it can't change any score.
   */
  designTallies: DesignTallies;
  /** Results saved for good when each day locked (T16). Days with no check-in have no entry. */
  locked: Record<DateKey, LockedDay>;
  /** Every day up to and including this one is locked. Null until the first lock. */
  lockedThrough: DateKey | null;
}

/** Test tools nudges to the pet's stats (P2-13). Love and Confidence themselves are worked out
 * from the log (rules/petStats.ts); Real saves keep these at 0. */
export type PetState = PetAdjust;

export const START_PET: PetState = { loveAdjust: 0, confidenceAdjust: 0 };

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
    version: 13,
    pet: START_PET,
    removed: [],
    habits: addedOn ? DEFAULT_HABITS.map((h) => ({ ...h, addedOn })) : DEFAULT_HABITS,
    log: {},
    targets: {},
    badHabits: [],
    slips: {},
    skips: {},
    designTallies: {},
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
  /** Test tools: makes a pet stat show this value (clamped to 0 to 100). */
  | { type: 'setStat'; stat: PetStat; value: number }
  /** Add habit (P2-09): a bad habit, standalone or paired with one good habit. */
  | { type: 'addBadHabit'; id: string; name: string; pairedWith?: string; date: DateKey }
  /** Tray tap: one more slip. */
  | { type: 'logSlip'; date: DateKey; badHabitId: string }
  /** Tray stepper and Undo: sets the day's count (never below 0). */
  | { type: 'setSlips'; date: DateKey; badHabitId: string; count: number }
  /** Slide right, Skip (P2-08b): hides the card for that day. */
  | { type: 'skipHabit'; date: DateKey; habitId: string }
  /** Undo after Skip. */
  | { type: 'unskipHabit'; date: DateKey; habitId: string };

/**
 * Saves the day's Activity Bar target the first time the day is seen, from the habits active at
 * that moment. Later adds and removes that day leave it alone (PRD-14).
 */
export function withTarget(
  state: TrackerState,
  date: DateKey,
  design: BadHabitDesign = 'design1',
): TrackerState {
  if (state.targets[date] !== undefined || isLocked(date, state.lockedThrough)) return state;
  const target = dayTarget(habitsForDesign(allHabits(state), design), date);
  return { ...state, targets: { ...state.targets, [date]: target } };
}

function withCount(state: TrackerState, date: DateKey, habitId: string, count: number) {
  const day = { ...state.log[date] };
  if (count <= 0) delete day[habitId];
  else day[habitId] = count;
  return { ...state, log: { ...state.log, [date]: day } };
}

function withTally(
  state: TrackerState,
  date: DateKey,
  design: BadHabitDesign,
  change: { logs?: number; slips?: number },
): TrackerState {
  const designTallies = addToTally(state.designTallies, date, design, change);
  return designTallies === state.designTallies ? state : { ...state, designTallies };
}

function updateHabit(state: TrackerState, habitId: string, change: Partial<Habit>): TrackerState {
  return {
    ...state,
    habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, ...change } : habit)),
  };
}

/**
 * `design` is the bad habits layout in use (P2-10). It only changes how many logs finish a habit
 * and tags new logs for the playtest tally. Saved habits, logs, and slips are never rewritten.
 */
export function trackerReducer(
  state: TrackerState,
  action: TrackerAction,
  design: BadHabitDesign = 'design1',
): TrackerState {
  switch (action.type) {
    case 'logHabit': {
      // A locked day never changes (T16). The screens turn taps off too; this is the backstop.
      if (isLocked(action.date, state.lockedThrough)) return state;
      const habit = allHabits(state).find((h) => h.id === action.habitId);
      if (!habit || !existsOn(habit, action.date)) return state;
      const count = logCount(state.log, action.date, action.habitId);
      // A finished habit takes no more logs. Linked slips count toward finished too (P2-08b).
      const { total } = dayLogs(habit, state.log, state.slips, state.badHabits, action.date);
      if (total >= timesFor(habit, design)) return state;
      const next = withCount(
        withTarget(state, action.date, design),
        action.date,
        action.habitId,
        count + 1,
      );
      return withTally(next, action.date, design, { logs: 1 });
    }
    case 'undoLog': {
      if (isLocked(action.date, state.lockedThrough)) return state;
      const count = logCount(state.log, action.date, action.habitId);
      if (count <= 0) return state;
      const next = withCount(state, action.date, action.habitId, count - 1);
      return withTally(next, action.date, design, { logs: -1 });
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
      const before = withTarget(state, action.date, design);
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
      const before = withTarget(state, action.date, design);
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
      return withTarget(lockDays(state, action.today, action.openDays), action.today, design);
    case 'fillDay': {
      if (isLocked(action.date, state.lockedThrough)) return state;
      const withDay = withTarget(state, action.date, design);
      const day = { ...withDay.log[action.date] };
      let changed = false;
      for (const habit of withDay.habits) {
        const times = timesFor(habit, design);
        if (!existsOn(habit, action.date) || (day[habit.id] ?? 0) >= times) continue;
        day[habit.id] = times;
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
      // A linked slip fills one of its good habit's segments, so it stops when that habit is
      // finished, the same as a gold log (P2-08b). Standalone slips have no limit.
      const bad = state.badHabits.find((b) => b.id === action.badHabitId);
      const partner = state.habits.find((h) => h.id === bad?.pairedWith);
      if (action.type === 'logSlip' && partner) {
        const { total } = dayLogs(partner, state.log, state.slips, state.badHabits, action.date);
        if (total >= timesFor(partner, design)) return state;
      }
      const next = action.type === 'logSlip' ? current + 1 : cleanCount(action.count);
      if (next === current) return state;
      const day = { ...state.slips[action.date] };
      if (next === 0) delete day[action.badHabitId];
      else day[action.badHabitId] = next;
      const withSlips = { ...state, slips: { ...state.slips, [action.date]: day } };
      return withTally(withSlips, action.date, design, { slips: next - current });
    }
    case 'skipHabit':
    case 'unskipHabit': {
      if (isLocked(action.date, state.lockedThrough)) return state;
      const skipped = isSkipped(state.skips, action.date, action.habitId);
      if (action.type === 'skipHabit' ? skipped : !skipped) return state;
      const day = state.skips[action.date] ?? [];
      const next =
        action.type === 'skipHabit'
          ? [...day, action.habitId]
          : day.filter((id) => id !== action.habitId);
      return { ...state, skips: { ...state.skips, [action.date]: next } };
    }
    case 'setStat': {
      const key = action.stat === 'love' ? 'loveAdjust' : 'confidenceAdjust';
      const adjust = adjustFor(action.stat, action.value, state);
      return adjust === state.pet[key] ? state : { ...state, pet: { ...state.pet, [key]: adjust } };
    }
  }
}
