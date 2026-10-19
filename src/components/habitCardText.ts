// What the Habit Card says, on screen and to screen readers. Plain functions so they can be
// unit tested without rendering anything.

import { MAX_STARS, STARS, type CheckIn } from '@/rules/scoring';

export const SCORE_LABELS: Record<CheckIn, string> = {
  NotToday: 'Not today',
  Started: 'Started',
  OnTrack: 'On track',
  NailedIt: 'Nailed it',
};

/**
 * The one status slot under the stars (SPEC-00): the score name after a tap, "Score needed"
 * on a due card that hasn't been scored, otherwise empty.
 */
export function statusText(checkIn: CheckIn | undefined, isDue: boolean): string {
  if (checkIn) return SCORE_LABELS[checkIn];
  return isDue ? 'Score needed' : '';
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
  isDue: boolean,
  done: number,
  goal: number,
): string {
  const parts = [name.trim() || 'Untitled habit'];
  if (checkIn) parts.push(`${SCORE_LABELS[checkIn]}, ${STARS[checkIn]} of ${MAX_STARS} stars`);
  else if (isDue) parts.push('Score needed');
  else parts.push('optional today');
  parts.push(weekProgressText(done, goal));
  return parts.join(', ');
}
