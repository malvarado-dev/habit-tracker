// Locked cards (Bug #1). A locked card is dimmed with opacity, so anything rendered behind it
// shows through. Swiping is off on a locked day, so its swipe hints are not rendered at all.

export interface SwipeHints {
  left: 'Nailed it' | null;
  right: 'Skip' | null;
}

/** The swipe hints behind a card: both when it can be swiped, none when its day is locked. */
export function swipeHintsFor(locked: boolean): SwipeHints {
  return locked ? { left: null, right: null } : { left: 'Nailed it', right: 'Skip' };
}
