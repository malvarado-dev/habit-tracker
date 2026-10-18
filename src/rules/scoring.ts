// Daily scoring rules from SPEC-00. Plain TypeScript with no screens attached, so every
// rule here can be unit tested on its own.

import { daysLeftInWeek, earlierDaysThisWeek, type DateKey } from './dates';

/** A check-in for one habit on one day. Names follow the Glossary. */
export type CheckIn = 'NotToday' | 'Started' | 'OnTrack' | 'NailedIt';

export interface Habit {
  id: string;
  name: string;
  /** Days per week the habit should be done, 1 to 7. */
  weeklyTarget: number;
}

/** Every check-in, keyed by date, then by habit id. */
export type CheckInLog = Record<DateKey, Record<string, CheckIn>>;

export const MAX_STARS = 3;

export const STARS: Record<CheckIn, number> = {
  NotToday: 0,
  Started: 1,
  OnTrack: 2,
  NailedIt: 3,
};

/**
 * What a tap on the card does. The first tap gives On track (the most common honest
 * answer), then it cycles so the same tap also works as undo.
 */
export function nextCheckIn(current: CheckIn | undefined): CheckIn {
  switch (current) {
    case undefined:
      return 'OnTrack';
    case 'OnTrack':
      return 'NailedIt';
    case 'NailedIt':
      return 'NotToday';
    case 'NotToday':
      return 'Started';
    case 'Started':
      return 'OnTrack';
  }
}

/** Days earlier this week where the habit got at least one star. */
export function daysDoneEarlierThisWeek(log: CheckInLog, habitId: string, date: DateKey): number {
  return earlierDaysThisWeek(date).filter((day) => {
    const checkIn = log[day]?.[habitId];
    return checkIn !== undefined && STARS[checkIn] > 0;
  }).length;
}

/** The weekly target was already met before today, so the habit collapses for the rest of the week. */
export function isTargetMetEarlier(habit: Habit, log: CheckInLog, date: DateKey): boolean {
  return daysDoneEarlierThisWeek(log, habit.id, date) >= habit.weeklyTarget;
}

/**
 * Skipping is fine, as long as you can still hit your weekly goal. Not today is free when
 * the days left after today are still enough to meet the target. Otherwise it's a miss.
 */
export function isFreeSkip(habit: Habit, log: CheckInLog, date: DateKey): boolean {
  const stillNeeded = habit.weeklyTarget - daysDoneEarlierThisWeek(log, habit.id, date);
  const daysAfterToday = daysLeftInWeek(date) - 1;
  return daysAfterToday >= stillNeeded;
}

export interface DailyResult {
  /** Habits shown on today's list (not collapsed). */
  activeCount: number;
  /** Active habits with any check-in, including Not today. */
  checkedInCount: number;
  earnedStars: number;
  possibleStars: number;
  /** Every active habit has a check-in. */
  isComplete: boolean;
  /** Complete, with nothing due (everything collapsed or a free skip). No rank. */
  isRestDay: boolean;
  /** Earned divided by possible, 0 to 1. Null when nothing counts yet. */
  score: number | null;
}

export function getDailyResult(habits: Habit[], log: CheckInLog, date: DateKey): DailyResult {
  const today = log[date] ?? {};
  let activeCount = 0;
  let checkedInCount = 0;
  let earnedStars = 0;
  let possibleStars = 0;

  for (const habit of habits) {
    if (isTargetMetEarlier(habit, log, date)) continue;
    activeCount += 1;

    const checkIn = today[habit.id];
    if (checkIn === undefined) {
      // Not checked in yet: it still counts toward what's possible today.
      possibleStars += MAX_STARS;
      continue;
    }

    checkedInCount += 1;
    if (checkIn === 'NotToday' && isFreeSkip(habit, log, date)) continue;
    earnedStars += STARS[checkIn];
    possibleStars += MAX_STARS;
  }

  const isComplete = checkedInCount === activeCount;
  return {
    activeCount,
    checkedInCount,
    earnedStars,
    possibleStars,
    isComplete,
    isRestDay: isComplete && possibleStars === 0,
    score: possibleStars > 0 ? earnedStars / possibleStars : null,
  };
}

/** How much of today is checked in, 0 to 1, for the energy bar. */
export function getEnergy(result: DailyResult): number {
  return result.activeCount === 0 ? 1 : result.checkedInCount / result.activeCount;
}
