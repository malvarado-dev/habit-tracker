// Weekly goal rules for Habits and Edit habit (SPEC-00, T12). Plain functions, no screens,
// so every goal can be unit tested: the result line, the presets, and switching between
// Specific days and Any days.

import { EVERY_DAY, goalCount, type WeeklyGoal, type Weekday } from '@/rules/scoring';

export const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4];
export const WEEKENDS: Weekday[] = [5, 6];

/** Day buttons, Monday first. Short letter on the button, full name for screen readers. */
export const DAY_LABELS: { day: Weekday; short: string; name: string }[] = [
  { day: 0, short: 'M', name: 'Monday' },
  { day: 1, short: 'T', name: 'Tuesday' },
  { day: 2, short: 'W', name: 'Wednesday' },
  { day: 3, short: 'T', name: 'Thursday' },
  { day: 4, short: 'F', name: 'Friday' },
  { day: 5, short: 'S', name: 'Saturday' },
  { day: 6, short: 'S', name: 'Sunday' },
];

export type Preset = 'everyDay' | 'weekdays' | 'weekends';

export const PRESETS: { key: Preset; label: string; days: Weekday[] }[] = [
  { key: 'everyDay', label: 'Every day', days: EVERY_DAY },
  { key: 'weekdays', label: 'Weekdays', days: WEEKDAYS },
  { key: 'weekends', label: 'Weekends', days: WEEKENDS },
];

const sameDays = (a: Weekday[], b: Weekday[]) =>
  a.length === b.length && [...a].sort().every((d, i) => d === [...b].sort()[i]);

/** Which preset the picked days match, if any, so its chip shows as selected. */
export function matchingPreset(days: Weekday[]): Preset | null {
  return PRESETS.find((p) => sameDays(p.days, days))?.key ?? null;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The line under the picker on Edit habit (Figma "Edit habit"):
 * "Every day", "3 days a week", or "4 times a week, any days".
 */
export function resultLine(goal: WeeklyGoal): string {
  if (goal.kind === 'anyDays')
    return `${plural(goal.timesPerWeek, 'time', 'times')} a week, any days`;
  if (goal.days.length === 7) return 'Every day';
  return `${plural(goal.days.length, 'day', 'days')} a week`;
}

/** The small line under each name on the Habits list: "Every day" or "Any days, 3 a week". */
export function listLine(goal: WeeklyGoal): string {
  if (goal.kind === 'anyDays') return `Any days, ${goal.timesPerWeek} a week`;
  return resultLine(goal);
}

/** Tapping a day turns it on or off, but the last planned day can't be turned off (minimum 1). */
export function toggleDay(days: Weekday[], day: Weekday): Weekday[] {
  if (days.includes(day)) return days.length > 1 ? days.filter((d) => d !== day) : days;
  return [...days, day].sort() as Weekday[];
}

/**
 * Spreads n days across the week for a habit that had no planned days yet:
 * 7 is every day, 5 is weekdays, 3 is Mon, Wed, Fri.
 */
export function spreadDays(n: number): Weekday[] {
  if (n >= 7) return EVERY_DAY;
  if (n === 5) return WEEKDAYS;
  const days = new Set<Weekday>();
  for (let i = 0; i < n; i++) days.add(Math.floor((i * 7) / n) as Weekday);
  return [...days].sort() as Weekday[];
}

/**
 * Switching between Specific days and Any days keeps the same number of days a week.
 * Going back to Specific days reuses the days picked before when the count still matches.
 */
export function switchGoal(
  goal: WeeklyGoal,
  to: WeeklyGoal['kind'],
  lastDays?: Weekday[],
): WeeklyGoal {
  if (goal.kind === to) return goal;
  const n = goalCount(goal);
  if (to === 'anyDays') return { kind: 'anyDays', timesPerWeek: n };
  const days = lastDays && lastDays.length === n ? lastDays : spreadDays(n);
  return { kind: 'specificDays', days };
}
