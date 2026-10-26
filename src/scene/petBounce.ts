// Asks the pet on Today to bounce. Test tools uses it (P2-11) so the bounce can be reviewed on
// demand; later tickets (wake rule P2-12, Activity Bar moments) can call it too.
// A request waits until the pet is on screen, then plays once.

type Listener = () => void;

let pending = false;
const listeners = new Set<Listener>();

export function requestPetBounce(): void {
  pending = true;
  listeners.forEach((l) => l());
}

/** True once per request; clears it. */
export function takePetBounce(): boolean {
  const was = pending;
  pending = false;
  return was;
}

export function onPetBounceRequest(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
