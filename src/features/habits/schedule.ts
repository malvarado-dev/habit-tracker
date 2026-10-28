// Schedule rules for Habits and Edit habit (Glossary: Schedule). A schedule only decides when a
// habit is due; weekly goals were removed in P2-08a. Plain functions, no screens, so every rule
// can be unit tested: the result line, the presets, and switching between Specific days and Any days.

import { calendar } from '@/config/calendar';
import { EVERY_DAY, type Schedule, type Weekday } from '@/rules/habits';

export const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4];
export const WEEKENDS: Weekday[] = [5, 6];

const ALL_DAY_LABELS: { day: Weekday; short: string; name: string }[] = [
  { day: 0, short: 'M', name: 'Monday' },
  { day: 1, short: 'T', name: 'Tuesday' },
  { day: 2, short: 'W', name: 'Wednesday' },
  { day: 3, short: 'T', name: 'Thursday' },
  { day: 4, short: 'F', name: 'Friday' },
  { day: 5, short: 'S', name: 'Saturday' },
  { day: 6, short: 'S', name: 'Sunday' },
];

/** Day buttons in week order, starting on calendar.weekStartsOn (Sunday). Short letter on the button, full name for screen readers. */
export const DAY_LABELS = ALL_DAY_LABELS.map(
  (_, i) => ALL_DAY_LABELS[(i + calendar.weekStartsOn) % 7]!,
);

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

/** The line under the picker on Edit habit: "Every day", "3 days a week", or "Any days". */
export function resultLine(schedule: Schedule): string {
  if (schedule.kind === 'anyDays') return 'Any days';
  if (schedule.days.length === 7) return 'Every day';
  return `${plural(schedule.days.length, 'day', 'days')} a week`;
}

/** The small line under each name on the Habits list. Same words as the result line. */
export function listLine(schedule: Schedule, times = 1): string {
  const line = resultLine(schedule);
  return times >= 2 ? `${line}, ${times}x per day` : line;
}

/** Tapping a day turns it on or off, but the last planned day can't be turned off (minimum 1). */
export function toggleDay(days: Weekday[], day: Weekday): Weekday[] {
  if (days.includes(day)) return days.length > 1 ? days.filter((d) => d !== day) : days;
  return [...days, day].sort() as Weekday[];
}

/**
 * Switching between Specific days and Any days. Going back to Specific days reuses the days
 * picked before, or every day if there were none.
 */
export function switchSchedule(
  schedule: Schedule,
  to: Schedule['kind'],
  lastDays?: Weekday[],
): Schedule {
  if (schedule.kind === to) return schedule;
  if (to === 'anyDays') return { kind: 'anyDays' };
  return { kind: 'specificDays', days: lastDays && lastDays.length > 0 ? lastDays : EVERY_DAY };
}
