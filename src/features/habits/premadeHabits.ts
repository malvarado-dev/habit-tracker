// The habit catalog on Add habit (PRD-02 Premade catalog, P2-09). Mirrors the Habits database
// in Notion (on Habit Tracking & Bad Habits): every habit's category, type, default schedule, and
// pairing. Change that database and this file together; premadeHabits.test.ts checks them row by
// row. Icons are letter placeholders until the icon sheet.

import { EVERY_DAY, type Habit, type Schedule } from '@/rules/habits';

import { nameKey } from './habitName';

export type HabitCategory =
  | 'Daily Maintenance'
  | 'Body & Mind'
  | 'Growth & Productivity'
  | 'Social & Relationships'
  | 'Hobbies';

export const HABIT_CATEGORIES: HabitCategory[] = [
  'Daily Maintenance',
  'Body & Mind',
  'Growth & Productivity',
  'Social & Relationships',
  'Hobbies',
];

export interface PremadeHabit {
  /** Stable key for routes and test IDs. */
  key: string;
  name: string;
  category: HabitCategory;
  schedule: Schedule;
}

export interface PremadeBadHabit {
  key: string;
  name: string;
  /** The good habit it pairs with in the catalog, by premade key. */
  pairsWith?: string;
  /**
   * A mirror of a good habit: not doing the good habit already records the day (Poor Sleep,
   * Sedentary). Hidden in Design 2 (PRD-15).
   */
  mirror?: boolean;
}

const everyDay: Schedule = { kind: 'specificDays', days: EVERY_DAY };
const anyDays: Schedule = { kind: 'anyDays' };

const good = (key: string, name: string, category: HabitCategory, every: boolean) => ({
  key,
  name,
  category,
  schedule: every ? everyDay : anyDays,
});

export const PREMADE_HABITS: PremadeHabit[] = [
  good('brush-teeth', 'Brush Teeth', 'Daily Maintenance', true),
  good('drink-water', 'Drink Water', 'Daily Maintenance', true),
  good('make-bed', 'Make Bed', 'Daily Maintenance', true),
  good('medicine', 'Medicine', 'Daily Maintenance', true),
  good('sleep', 'Sleep', 'Daily Maintenance', true),
  good('eat-healthy', 'Eat Healthy', 'Body & Mind', true),
  good('exercise', 'Exercise', 'Body & Mind', false),
  good('journal', 'Journal', 'Body & Mind', false),
  good('meditate', 'Meditate', 'Body & Mind', false),
  good('positivity', 'Positivity', 'Body & Mind', true),
  good('pray', 'Pray', 'Body & Mind', true),
  good('stretch', 'Stretch', 'Body & Mind', false),
  good('supplements', 'Supplements', 'Body & Mind', false),
  good('running', 'Running', 'Body & Mind', false),
  good('biking', 'Biking', 'Body & Mind', false),
  good('walking', 'Walking', 'Body & Mind', true),
  good('budget', 'Budget', 'Growth & Productivity', false),
  good('code', 'Code', 'Growth & Productivity', false),
  good('plan-day', 'Plan Day', 'Growth & Productivity', false),
  good('read', 'Read', 'Growth & Productivity', false),
  good('study', 'Study', 'Growth & Productivity', false),
  good('family-time', 'Family Time', 'Social & Relationships', false),
  good('friend-time', 'Friend Time', 'Social & Relationships', false),
  good('pet-time', 'Pet Time', 'Social & Relationships', true),
  good('arts-crafts', 'Arts & Crafts', 'Hobbies', false),
  good('gaming', 'Gaming', 'Hobbies', false),
  good('music', 'Music', 'Hobbies', false),
  good('outdoors', 'Outdoors', 'Hobbies', false),
];

export const PREMADE_BAD_HABITS: PremadeBadHabit[] = [
  { key: 'poor-sleep', name: 'Poor Sleep', pairsWith: 'sleep', mirror: true },
  { key: 'eat-out', name: 'Eat Out', pairsWith: 'eat-healthy' },
  { key: 'sedentary', name: 'Sedentary', pairsWith: 'exercise', mirror: true },
  { key: 'alcohol', name: 'Alcohol' },
  { key: 'smoking', name: 'Smoking' },
  { key: 'snacks-sweets', name: 'Snacks & Sweets' },
  { key: 'soda', name: 'Soda' },
  { key: 'late-night-screens', name: 'Late Night Screens' },
  { key: 'too-much-gaming', name: 'Too Much Gaming' },
  { key: 'too-much-tv', name: 'Too Much TV' },
  { key: 'over-working', name: 'Over-working' },
];

export function findPremade(key: string | undefined): PremadeHabit | undefined {
  return PREMADE_HABITS.find((p) => p.key === key);
}

export function findPremadeBad(key: string | undefined): PremadeBadHabit | undefined {
  return PREMADE_BAD_HABITS.find((p) => p.key === key);
}

/** Already on the user's list, by name (ignoring capitals and extra spaces). */
export function isAdded(premade: { name: string }, list: { name: string }[]): boolean {
  return list.some((h) => nameKey(h.name) === nameKey(premade.name));
}

/** The bad habits Add habit offers. Design 2 hides the mirror ones (PRD-15). */
export function offeredBadHabits(design: 'design1' | 'design2'): PremadeBadHabit[] {
  return design === 'design2' ? PREMADE_BAD_HABITS.filter((b) => !b.mirror) : PREMADE_BAD_HABITS;
}

/**
 * The good habit a catalog bad habit pairs with, if the user has it: matched by name, since the
 * user's habits don't keep their catalog key. Undefined means it starts standalone.
 */
export function suggestedPair(
  bad: PremadeBadHabit | undefined,
  habits: Habit[],
): string | undefined {
  const partner = findPremade(bad?.pairsWith);
  if (!partner) return undefined;
  return habits.find((h) => nameKey(h.name) === nameKey(partner.name))?.id;
}

/**
 * A mirror bad habit (Poor Sleep, Sedentary): not doing its good habit already records the day,
 * so Design 2 hides it (PRD-15). Matched by the catalog key in its id, or by name for a bad habit
 * the user typed in with the same name.
 */
export function isMirrorBadHabit(bad: { id: string; name: string }): boolean {
  return PREMADE_BAD_HABITS.some(
    (p) => p.mirror && (bad.id.startsWith(`bad-${p.key}-`) || isAdded(p, [bad])),
  );
}
