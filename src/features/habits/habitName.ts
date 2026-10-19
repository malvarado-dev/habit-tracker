// Habit name rules (SPEC-00, decided 2026-10-19): never blank, never a duplicate, at most
// 20 characters. Shared by Add habit, Edit habit, and the reducer, so all three agree.

import type { Habit } from '@/rules/scoring';

/** Fits one line of a phone habit card at normal text size. Bigger text sizes get "…". */
export const MAX_NAME_LENGTH = 20;

/** Show the "18 of 20" counter only once the name is getting close to the limit. */
export const NAME_COUNTER_FROM = 15;

/** Trims the ends and squeezes runs of spaces to one. */
export function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** The form two names are compared in: cleaned and lowercase. */
export function nameKey(name: string): string {
  return cleanName(name).toLowerCase();
}

export type NameProblem = 'blank' | 'duplicate' | 'tooLong';

/**
 * What's wrong with a name, or null if it can be saved.
 * `exceptId` is the habit being edited, so keeping its own name is fine.
 */
export function nameProblem(name: string, habits: Habit[], exceptId?: string): NameProblem | null {
  const clean = cleanName(name);
  if (!clean) return 'blank';
  if (clean.length > MAX_NAME_LENGTH) return 'tooLong';
  const key = nameKey(clean);
  if (habits.some((h) => h.id !== exceptId && nameKey(h.name) === key)) return 'duplicate';
  return null;
}

/** The one-line hint under the name field. */
export function nameHint(name: string, habits: Habit[], exceptId?: string): string {
  switch (nameProblem(name, habits, exceptId)) {
    case 'blank':
      return 'Give this habit a name.';
    case 'duplicate': {
      const match = habits.find((h) => h.id !== exceptId && nameKey(h.name) === nameKey(name));
      return `You already have a habit called ${match?.name ?? cleanName(name)}.`;
    }
    case 'tooLong':
      return `Names can be up to ${MAX_NAME_LENGTH} characters.`;
    case null:
      return '';
  }
}

/** "18 of 20" once the name passes NAME_COUNTER_FROM characters, otherwise nothing. */
export function nameCounter(name: string): string {
  return name.length > NAME_COUNTER_FROM ? `${name.length} of ${MAX_NAME_LENGTH}` : '';
}
