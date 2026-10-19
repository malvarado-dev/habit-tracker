// What the History screen shows, as plain data (SPEC-00 History, T16). No screens here, so the
// month grid, day labels, open/locked wording, and the week panel are all unit tested.

import { calendar } from '@/config/calendar';
import {
  addDays,
  addMonths,
  daysBetween,
  daysInMonth,
  daysOfWeek,
  monthOf,
  weekdayIndex,
  weekPosition,
  type DateKey,
} from '@/rules/dates';
import { historyDay, isLocked, type LockState, type LockedDay } from '@/rules/locking';
import { existsOn, STARS, weekGoal, type CheckInLog, type Habit } from '@/rules/scoring';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
/** By saved weekday number: Monday is 0. */
const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKDAY_LETTER = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** "October 2026" */
export function monthTitle(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[m! - 1]} ${y}`;
}

/** "Tue, Oct 14" */
export function shortDate(date: DateKey): string {
  const [, m, d] = date.split('-').map(Number);
  return `${WEEKDAY_SHORT[weekdayIndex(date)]}, ${MONTHS[m! - 1]!.slice(0, 3)} ${d}`;
}

/** Column headers in week order, Sunday first: S M T W T F S. */
export function weekdayLetters(): string[] {
  return Array.from({ length: 7 }, (_, i) => WEEKDAY_LETTER[(i + calendar.weekStartsOn) % 7]!);
}

/** The oldest month with any check-in, or this month if there are none yet. */
export function firstMonth(log: CheckInLog, today: DateKey): string {
  const dated = Object.keys(log).filter((d) => Object.keys(log[d] ?? {}).length > 0);
  const oldest = dated.sort()[0];
  return oldest && oldest < today ? monthOf(oldest) : monthOf(today);
}

/** Can't go before the first month with data or past this month. */
export function monthLimits(month: string, log: CheckInLog, today: DateKey) {
  return { canPrev: month > firstMonth(log, today), canNext: month < monthOf(today) };
}

export function stepMonth(month: string, by: 1 | -1, log: CheckInLog, today: DateKey): string {
  const next = addMonths(month, by);
  if (next < firstMonth(log, today) || next > monthOf(today)) return month;
  return next;
}

export type CellKind = 'outside' | 'future' | 'day';

export interface DayCell {
  date: DateKey;
  /** Day of the month, shown at the top of the cell. */
  dayNumber: number;
  /** outside: another month's day, shown faint. future: faint, can't be opened. */
  kind: CellKind;
  isToday: boolean;
  /** Rank, Rest, or none. Undefined for outside and future cells. */
  result?: LockedDay;
}

/** The month as weeks of 7 cells, Sunday first, padded with the next and previous months' days. */
export function monthGrid(month: string, state: LockState, today: DateKey): DayCell[][] {
  const days = daysInMonth(month);
  const start = daysOfWeek(days[0]!)[0]!;
  const total = Math.ceil((weekPosition(days[0]!) + days.length) / 7) * 7;
  const cells = Array.from({ length: total }, (_, i): DayCell => {
    const date = addDays(start, i);
    const kind: CellKind = monthOf(date) !== month ? 'outside' : date > today ? 'future' : 'day';
    return {
      date,
      dayNumber: Number(date.slice(8)),
      kind,
      isToday: date === today,
      result: kind === 'day' ? historyDay(state, date) : undefined,
    };
  });
  return Array.from({ length: total / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

/** What a screen reader hears for a day cell: "Tue, Oct 14, S rank", "…, Rest day", "…, No check-in". */
export function dayCellLabel(cell: DayCell): string {
  const date = shortDate(cell.date);
  if (cell.kind === 'future') return `${date}, not yet`;
  const result = cell.result;
  if (!result || result.outcome === 'none') return `${date}, No check-in`;
  if (result.outcome === 'rest') return `${date}, Rest day`;
  return `${date}, ${result.rank} rank`;
}

/**
 * The line under the date on the Day screen. Today and the 2 days before are open; the day 2
 * days back locks tonight at midnight. Locking always uses the real date.
 */
export function dayStatusText(date: DateKey, realToday: DateKey, lockedThrough: DateKey | null) {
  if (
    isLocked(date, lockedThrough) ||
    daysBetween(date, realToday) > calendar.openDaysBeforeToday
  ) {
    return { locked: true, text: 'Locked. Only the last 2 days can change.' };
  }
  const nightsLeft = calendar.openDaysBeforeToday - daysBetween(date, realToday);
  if (nightsLeft <= 0) return { locked: false, text: 'You can change this day until tonight' };
  if (nightsLeft === 1)
    return { locked: false, text: 'You can change this day until tomorrow night' };
  const lockNight = WEEKDAY_LONG[(weekdayIndex(realToday) + nightsLeft) % 7];
  return { locked: false, text: `You can change this day until ${lockNight} night` };
}

/** A day can be opened if it's today or earlier. Future days can't. */
export function canOpenDay(date: DateKey, today: DateKey): boolean {
  return date <= today;
}

export interface WeekRow {
  habitId: string;
  name: string;
  color: Habit['color'];
  goal: number;
  /** Days this week scored Started, On track, or Nailed it. Skip never counts. */
  done: number;
  /** "3 of 4", or "3 +1" past the goal. */
  label: string;
  /** "Sleep, 3 of 4 this week" */
  a11yLabel: string;
}

/** One row per habit for the week a date falls in. Count only (best-N star quality is Later). */
export function weekRows(habits: Habit[], log: CheckInLog, date: DateKey): WeekRow[] {
  const days = daysOfWeek(date);
  // A habit gets a row only if it was active some day that week (#52, T21).
  return habits
    .filter((habit) => days.some((d) => existsOn(habit, d)))
    .map((habit) => {
      const goal = weekGoal(habit, date);
      const done = days.filter((d) => {
        if (!existsOn(habit, d)) return false;
        const checkIn = log[d]?.[habit.id];
        return checkIn !== undefined && STARS[checkIn] > 0;
      }).length;
      const label = done > goal ? `${goal} +${done - goal}` : `${done} of ${goal}`;
      const name = habit.name || 'Unnamed habit';
      return {
        habitId: habit.id,
        name,
        color: habit.color,
        goal,
        done,
        label,
        a11yLabel: `${name}, ${done > goal ? `goal met, ${done - goal} extra` : `${done} of ${goal}`} this week`,
      };
    });
}

/** "Week of Oct 11", the week's first day. */
export function weekTitle(date: DateKey): string {
  const first = daysOfWeek(date)[0]!;
  const [, m, d] = first.split('-').map(Number);
  return `Week of ${MONTHS[m! - 1]!.slice(0, 3)} ${d}`;
}
