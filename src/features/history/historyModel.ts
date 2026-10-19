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

/**
 * The oldest month the arrows reach. Real: the first month with data. Test (T22): exactly the
 * month of the oldest day that can be opened, data or not, so a whole window can be filled in.
 */
export function earliestMonth(log: CheckInLog, today: DateKey, oldestDay: DateKey | null): string {
  return oldestDay ? monthOf(oldestDay) : firstMonth(log, today);
}

/** Can't go before the earliest month or past this month. */
export function monthLimits(
  month: string,
  log: CheckInLog,
  today: DateKey,
  oldestDay: DateKey | null = null,
) {
  return {
    canPrev: month > earliestMonth(log, today, oldestDay),
    canNext: month < monthOf(today),
  };
}

export function stepMonth(
  month: string,
  by: 1 | -1,
  log: CheckInLog,
  today: DateKey,
  oldestDay: DateKey | null = null,
): string {
  const next = addMonths(month, by);
  if (next < earliestMonth(log, today, oldestDay) || next > monthOf(today)) return month;
  return next;
}

export type CellKind = 'outside' | 'future' | 'tooOld' | 'day';

export interface DayCell {
  date: DateKey;
  /** Day of the month, shown at the top of the cell. */
  dayNumber: number;
  /**
   * outside: another month's day, shown faint. future: faint, can't be opened. tooOld: Test
   * only, older than its open window; faint, can't be opened (T22).
   */
  kind: CellKind;
  isToday: boolean;
  /** Rank, Rest, or none. Undefined for outside and future cells. */
  result?: LockedDay;
}

/** The month as weeks of 7 cells, Sunday first, padded with the next and previous months' days. */
export function monthGrid(
  month: string,
  state: LockState,
  today: DateKey,
  oldestDay: DateKey | null = null,
): DayCell[][] {
  const days = daysInMonth(month);
  const start = daysOfWeek(days[0]!)[0]!;
  const total = Math.ceil((weekPosition(days[0]!) + days.length) / 7) * 7;
  const cells = Array.from({ length: total }, (_, i): DayCell => {
    const date = addDays(start, i);
    const kind: CellKind =
      monthOf(date) !== month
        ? 'outside'
        : date > today
          ? 'future'
          : oldestDay !== null && date < oldestDay
            ? 'tooOld'
            : 'day';
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
  if (cell.kind === 'tooOld') return `${date}, too far back to open in Test`;
  const result = cell.result;
  if (!result || result.outcome === 'none') return `${date}, No check-in`;
  if (result.outcome === 'rest') return `${date}, Rest day`;
  return `${date}, ${result.rank} rank`;
}

const MINUTES_PER_DAY = 24 * 60;

/**
 * The short line at the top of the Day screen's sheet (changed 2026-10-19, T24). An open day
 * counts down to the midnight it locks: "Habits lock in 38hrs", then "Habits lock in 12mins" in
 * the last hour. Real locks a day once it's more than 2 days old: "Habits locked in", cards off.
 * Test keeps those older days changeable (T22), so they read "Habits locked in" but stay open.
 * `now` is the clock time; only its hours and minutes are used, against the (pretend) today.
 */
export function dayStatusText(
  date: DateKey,
  today: DateKey,
  lockedThrough: DateKey | null,
  openDays: number = calendar.openDaysBeforeToday,
  now: Date = new Date(),
) {
  const age = daysBetween(date, today);
  if (isLocked(date, lockedThrough) || age > openDays) {
    return { locked: true, text: 'Habits locked in' };
  }
  const realWindow = calendar.openDaysBeforeToday;
  if (age > realWindow) return { locked: false, text: 'Habits locked in' };
  return { locked: false, text: lockCountdown(realWindow - age, now) };
}

/** Time left until the midnight that ends `fullDaysAfterToday` days after today. */
export function lockCountdown(fullDaysAfterToday: number, now: Date): string {
  const sinceMidnight = now.getHours() * 60 + now.getMinutes();
  const minutes = Math.max(1, (fullDaysAfterToday + 1) * MINUTES_PER_DAY - sinceMidnight);
  if (minutes < 60) return `Habits lock in ${minutes}${minutes === 1 ? 'min' : 'mins'}`;
  const hours = Math.floor(minutes / 60);
  return `Habits lock in ${hours}${hours === 1 ? 'hr' : 'hrs'}`;
}

/**
 * The Energy bar label on the Day screen (T24): "Today" for today, otherwise the date in the
 * phone's format ("Thu, Oct 15" in the US), with the year added outside today's year.
 * `locale` is undefined on the phone (its own setting); tests pin one.
 */
export function dayBarLabel(date: DateKey, today: DateKey, locale?: string): string {
  if (date === today) return 'Today';
  const [y, m, d] = date.split('-').map(Number);
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y!, m! - 1, d!)));
}

/**
 * A day can be opened if it's today or earlier, and in Test, not older than its open window
 * (T22). Future days can't.
 */
export function canOpenDay(
  date: DateKey,
  today: DateKey,
  oldestDay: DateKey | null = null,
): boolean {
  return date <= today && (oldestDay === null || date >= oldestDay);
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
