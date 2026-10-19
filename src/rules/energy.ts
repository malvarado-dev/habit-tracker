// What the Energy bar counts (SPEC-00, T18, decided 2026-10-19). Separate from the rank on
// purpose: the bar counts habits due today plus Any days habits still owed this week, and every
// counted star moves it the same amount. Extras past a weekly goal don't move it and earn
// nothing. The rank (getDailyResult) is unchanged. Plain TypeScript, no screens.

import type { DateKey } from './dates';
import {
  daysDoneEarlierThisWeek,
  getWeekProgress,
  existsOn,
  isDue,
  MAX_STARS,
  STARS,
  type CheckInLog,
  type Habit,
  weekGoal,
} from './scoring';

/** The weekly goal was met on earlier days this week, before today. */
export function goalMetBefore(habit: Habit, log: CheckInLog, date: DateKey): boolean {
  return daysDoneEarlierThisWeek(log, habit, date) >= weekGoal(habit, date);
}

/**
 * The habit counts toward today's bar: due today, or an Any days habit whose weekly goal
 * isn't met yet. A met goal never counts, so extra stars don't move the bar.
 */
export function countsToday(habit: Habit, log: CheckInLog, date: DateKey): boolean {
  if (isDue(habit, log, date)) return true;
  return habit.goal.kind === 'anyDays' && existsOn(habit, date) && !goalMetBefore(habit, log, date);
}

export interface EnergyBarResult {
  earnedStars: number;
  possibleStars: number;
  /** 0 to 1. Full when nothing counts. */
  fill: number;
  /** Nothing counts toward the bar today (none owed, or all Skip): shown full, no celebration. */
  isRestDay: boolean;
}

export function getEnergyBar(habits: Habit[], log: CheckInLog, date: DateKey): EnergyBarResult {
  const day = log[date] ?? {};
  let earned = 0;
  let possible = 0;
  for (const habit of habits) {
    if (!countsToday(habit, log, date)) continue;
    const checkIn = day[habit.id];
    // Skip takes a habit out of today's bar.
    if (checkIn === 'NotToday') continue;
    possible += MAX_STARS;
    earned += checkIn ? STARS[checkIn] : 0;
  }
  return {
    earnedStars: earned,
    possibleStars: possible,
    fill: possible > 0 ? earned / possible : 1,
    isRestDay: possible === 0,
  };
}

/** What an unscored card says about its weekly goal: "To do", "Goal met", or nothing. */
export type CardNeed = 'toDo' | 'goalMet' | 'none';

export function cardNeed(habit: Habit, log: CheckInLog, date: DateKey): CardNeed {
  if (countsToday(habit, log, date)) return 'toDo';
  if (goalMetBefore(habit, log, date)) return 'goalMet';
  return 'none';
}

/**
 * Habits that just got a new scoring tap (Started or better) on `date` and whose weekly goal is
 * met with it, whether that tap reached the goal or it was met earlier in the week. These earn
 * "Weekly goal met". The once-per-session rule lives with the screen, not here.
 */
export function newlyScoredMetGoals(
  habits: Habit[],
  before: CheckInLog,
  after: CheckInLog,
  date: DateKey,
): Habit[] {
  return habits.filter((habit) => {
    const was = before[date]?.[habit.id];
    const now = after[date]?.[habit.id];
    if (now === undefined || now === was || STARS[now] === 0) return false;
    const { done, goal } = getWeekProgress(habit, after, date);
    return done >= goal;
  });
}
