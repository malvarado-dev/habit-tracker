// The premade habits on Pick a habit (SPEC-00, T13). Mirrors the "Premade habits" table in
// Notion (PRD-02 Category Management). Change that table and this file together.
// Daily-type habits start on Specific days, Every day; activity-type on Any days.
// Icon is a letter placeholder until the icon sheet, and color is the least-used habit color.

import { EVERY_DAY, type Habit, type Schedule } from '@/rules/habits';

import { nameKey } from './habitName';

export type PremadeGroup = 'Health' | 'Fitness' | 'Mind' | 'Fun and life';

export interface PremadeHabit {
  /** Stable key for routes and test IDs. */
  key: string;
  name: string;
  group: PremadeGroup;
  schedule: Schedule;
  /** One of the 4 habits a new user starts with. */
  starter: boolean;
}

const everyDay: Schedule = { kind: 'specificDays', days: EVERY_DAY };
const anyDays: Schedule = { kind: 'anyDays' };

export const PREMADE_GROUPS: PremadeGroup[] = ['Health', 'Fitness', 'Mind', 'Fun and life'];

export const PREMADE_HABITS: PremadeHabit[] = [
  { key: 'sleep', name: 'Sleep', group: 'Health', schedule: everyDay, starter: true },
  { key: 'diet', name: 'Diet', group: 'Health', schedule: everyDay, starter: true },
  { key: 'wellbeing', name: 'Wellbeing', group: 'Health', schedule: everyDay, starter: true },
  { key: 'exercise', name: 'Exercise', group: 'Fitness', schedule: anyDays, starter: true },
  { key: 'walking', name: 'Walking', group: 'Fitness', schedule: everyDay, starter: false },
  { key: 'stretching', name: 'Stretching', group: 'Fitness', schedule: everyDay, starter: false },
  { key: 'running', name: 'Running', group: 'Fitness', schedule: anyDays, starter: false },
  { key: 'biking', name: 'Biking', group: 'Fitness', schedule: anyDays, starter: false },
  { key: 'meditation', name: 'Meditation', group: 'Mind', schedule: everyDay, starter: false },
  { key: 'reading', name: 'Reading', group: 'Mind', schedule: everyDay, starter: false },
  { key: 'study', name: 'Study', group: 'Mind', schedule: anyDays, starter: false },
  { key: 'pet-time', name: 'Pet Time', group: 'Fun and life', schedule: everyDay, starter: false },
  {
    key: 'family-time',
    name: 'Family Time',
    group: 'Fun and life',
    schedule: anyDays,
    starter: false,
  },
  { key: 'outdoors', name: 'Outdoors', group: 'Fun and life', schedule: anyDays, starter: false },
  { key: 'gaming', name: 'Gaming', group: 'Fun and life', schedule: anyDays, starter: false },
];

export function findPremade(key: string | undefined): PremadeHabit | undefined {
  return PREMADE_HABITS.find((p) => p.key === key);
}

/** Already on the user's list, by name (ignoring capitals and extra spaces). */
export function isAdded(premade: PremadeHabit, habits: Habit[]): boolean {
  return habits.some((h) => nameKey(h.name) === nameKey(premade.name));
}
