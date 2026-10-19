// Daily scoring rules from SPEC-00. Plain TypeScript with no screens attached, so every
// rule here can be unit tested on its own.

import { earlierDaysThisWeek, weekdayIndex, type DateKey } from './dates';

/** A check-in for one habit on one day. Names follow the Glossary. No entry = To do. */
export type CheckIn = 'NotToday' | 'Started' | 'OnTrack' | 'NailedIt';

/**
 * Saved weekday number: Monday is 0, Sunday is 6. Fixed for saved habits; which day starts the
 * week is a separate setting (src/config/calendar.ts, Sunday since 2026-10-19).
 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Two ways to set a weekly goal (SPEC-00):
 * - Specific days: planned weekdays. The goal is the number of planned days.
 * - Any days: a number of times a week, never due on any one day.
 */
export type WeeklyGoal =
  { kind: 'specificDays'; days: Weekday[] } | { kind: 'anyDays'; timesPerWeek: number };

/** One of the 8 curated habit colors (design-system.md, habit-1 to habit-8). */
export type HabitColor =
  'habit1' | 'habit2' | 'habit3' | 'habit4' | 'habit5' | 'habit6' | 'habit7' | 'habit8';

export const HABIT_COLORS: HabitColor[] = [
  'habit1',
  'habit2',
  'habit3',
  'habit4',
  'habit5',
  'habit6',
  'habit7',
  'habit8',
];

export interface Habit {
  id: string;
  name: string;
  goal: WeeklyGoal;
  /** Shown in the progress ring, the icon, and the dots. */
  color: HabitColor;
}

/** Every check-in, keyed by date, then by habit id. */
export type CheckInLog = Record<DateKey, Record<string, CheckIn>>;

export const MAX_STARS = 3;
export const EVERY_DAY: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export const STARS: Record<CheckIn, number> = {
  NotToday: 0,
  Started: 1,
  OnTrack: 2,
  NailedIt: 3,
};

/**
 * What a tap on the card does. Counts up from To do, then Skip, then back
 * to To do, so the same tap also works as undo. Undefined means To do.
 */
export function nextCheckIn(current: CheckIn | undefined): CheckIn | undefined {
  switch (current) {
    case undefined:
      return 'Started';
    case 'Started':
      return 'OnTrack';
    case 'OnTrack':
      return 'NailedIt';
    case 'NailedIt':
      return 'NotToday';
    case 'NotToday':
      return undefined;
  }
}

/** How many days this week the habit needs to meet its goal. */
export function goalCount(goal: WeeklyGoal): number {
  return goal.kind === 'specificDays' ? goal.days.length : goal.timesPerWeek;
}

function counts(checkIn: CheckIn | undefined): checkIn is CheckIn {
  return checkIn !== undefined && STARS[checkIn] > 0;
}

/** Days earlier this week scored Started, On track, or Nailed it. Skip never counts. */
export function daysDoneEarlierThisWeek(log: CheckInLog, habitId: string, date: DateKey): number {
  return earlierDaysThisWeek(date).filter((day) => counts(log[day]?.[habitId])).length;
}

/** Weekly goal progress including today, for the progress ring: "2 of 4 this week." */
export function getWeekProgress(
  habit: Habit,
  log: CheckInLog,
  date: DateKey,
): { done: number; goal: number } {
  const today = counts(log[date]?.[habit.id]) ? 1 : 0;
  return {
    done: daysDoneEarlierThisWeek(log, habit.id, date) + today,
    goal: goalCount(habit.goal),
  };
}

/**
 * Due today: a Specific days habit on one of its planned days, until its weekly goal is met
 * on earlier days. An Any days habit is never due.
 */
export function isDue(habit: Habit, log: CheckInLog, date: DateKey): boolean {
  if (habit.goal.kind === 'anyDays') return false;
  if (!habit.goal.days.includes(weekdayIndex(date) as Weekday)) return false;
  return daysDoneEarlierThisWeek(log, habit.id, date) < goalCount(habit.goal);
}

export interface DailyResult {
  /** Habits due today. */
  dueCount: number;
  /** Due habits with any check-in, including Skip. */
  checkedInCount: number;
  /** Stars from due habits and optional (not due) habits. */
  earnedStars: number;
  possibleStars: number;
  /** Any habit has a check-in today, due or not. The first one wakes the critter. */
  hasCheckIn: boolean;
  /** Every due habit has a check-in. */
  isComplete: boolean;
  /** Complete, and nothing counts toward a score (nothing due, or all Skip, and no optional scores). No rank. */
  isRestDay: boolean;
  /** 0 to 1. Null when nothing counts yet. */
  score: number | null;
}

export function getDailyResult(habits: Habit[], log: CheckInLog, date: DateKey): DailyResult {
  const today = log[date] ?? {};
  let dueCount = 0;
  let checkedInCount = 0;
  let dueEarned = 0;
  let duePossible = 0;
  let optionalEarned = 0;
  let optionalPossible = 0;

  for (const habit of habits) {
    const checkIn = today[habit.id];

    if (isDue(habit, log, date)) {
      dueCount += 1;
      if (checkIn === undefined) {
        // To do: still counts toward what's possible, so the score climbs as you check in.
        duePossible += MAX_STARS;
        continue;
      }
      checkedInCount += 1;
      // Skip removes a due habit from today's math. It never lowers the rank.
      if (checkIn === 'NotToday') continue;
      dueEarned += STARS[checkIn];
      duePossible += MAX_STARS;
    } else if (counts(checkIn)) {
      optionalEarned += STARS[checkIn];
      optionalPossible += MAX_STARS;
    }
  }

  // Optional scores can only raise the day: take the higher of due alone and due plus optional.
  const dueScore = duePossible > 0 ? dueEarned / duePossible : null;
  const allPossible = duePossible + optionalPossible;
  const combined = allPossible > 0 ? (dueEarned + optionalEarned) / allPossible : null;
  const score = dueScore === null ? combined : Math.max(dueScore, combined ?? dueScore);
  const useOptional = score !== null && score === combined && optionalPossible > 0;

  const isComplete = checkedInCount === dueCount;
  return {
    dueCount,
    checkedInCount,
    hasCheckIn: Object.keys(today).length > 0,
    earnedStars: dueEarned + (useOptional ? optionalEarned : 0),
    possibleStars: duePossible + (useOptional ? optionalPossible : 0),
    isComplete,
    isRestDay: isComplete && score === null,
    score,
  };
}
