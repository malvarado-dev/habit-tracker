// Swipe left to close the side menu (SPEC-00, T25), kept apart from the component so it can be
// tested without rendering. A drag past a share of the panel width, or a quick flick left,
// closes it; anything else snaps back. Dragging right does nothing. There is no edge swipe to
// open, since it would clash with the card swipe and the browser's back swipe.
// Runs on the UI thread during the gesture, hence the worklet directives.

import { tuning } from '@/config/tuning';

/** How far the panel follows the finger: left only, never past fully closed. */
export function menuDragOffset(translationX: number, panelWidth: number): number {
  'worklet';
  return Math.max(-panelWidth, Math.min(0, translationX));
}

/** True when letting go should close the menu. */
export function shouldCloseMenu(
  translationX: number,
  velocityX: number,
  panelWidth: number,
): boolean {
  'worklet';
  const { swipeCloseShare, swipeCloseVelocity } = tuning.menu;
  if (translationX >= 0) return false;
  return -translationX >= panelWidth * swipeCloseShare || velocityX <= -swipeCloseVelocity;
}
