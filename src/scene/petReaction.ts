// Asks the pet on Today to play its reaction (P2-11b, #106). Called on wake and by Test tools;
// Activity Bar moments (P2-14) will call it too. The pet never reacts without a request.
// A request waits until the pet is on screen, then plays once.

type Listener = () => void;

let pending = false;
const listeners = new Set<Listener>();

export function requestPetReaction(): void {
  pending = true;
  listeners.forEach((l) => l());
}

/** True once per request; clears it. */
export function takePetReaction(): boolean {
  const was = pending;
  pending = false;
  return was;
}

export function onPetReactionRequest(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
