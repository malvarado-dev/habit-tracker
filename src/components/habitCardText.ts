// What the Habit Card says, on screen and to screen readers. Plain functions so they can be
// unit tested without rendering anything.

import { MAX_STARS, STARS, type CheckIn } from '@/rules/scoring';

import type { CardNeed } from '@/rules/energy';

export const SCORE_LABELS: Record<CheckIn, string> = {
  NotToday: 'Skip',
  Started: 'Started',
  OnTrack: 'On track',
  NailedIt: 'Nailed it',
};

export type { CardNeed } from '@/rules/energy';

/**
 * The one status slot under the stars (SPEC-00, T18): the score name after a tap. Unscored, it
 * says "To do" on a card that counts toward today's Energy bar, "Goal met" once its weekly goal
 * is already met, otherwise nothing.
 */
export function statusText(checkIn: CheckIn | undefined, need: CardNeed): string {
  if (checkIn) return SCORE_LABELS[checkIn];
  if (need === 'toDo') return 'To do';
  if (need === 'goalMet') return 'Goal met';
  return '';
}

/** First letter of the name, as the icon placeholder until the icon sheet. */
export function iconLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/** Weekly goal for screen readers, the same for Ring and Dots: "2 of 4 this week." */
export function weekProgressText(done: number, goal: number): string {
  return `${done} of ${goal} this week`;
}

/** The whole card in one sentence for screen readers. */
export function cardAccessibilityLabel(
  name: string,
  checkIn: CheckIn | undefined,
  need: CardNeed,
  done: number,
  goal: number,
): string {
  const parts = [name.trim() || 'Untitled habit'];
  if (checkIn) parts.push(`${SCORE_LABELS[checkIn]}, ${STARS[checkIn]} of ${MAX_STARS} stars`);
  else if (need === 'toDo') parts.push('To do');
  else if (need === 'goalMet') parts.push('Goal met');
  else parts.push('optional today');
  parts.push(weekProgressText(done, goal));
  return parts.join(', ');
}
