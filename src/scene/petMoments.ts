// The pet's moment queue (P2-14, #85). Anything that wants the pet to do something asks here, and
// the pet on Today plays them one at a time, so nothing overlaps: the wake reaction (P2-11b), the
// Activity Bar's full-bar moment, petting, and the affection purr. A request made while the pet
// isn't on screen waits until it is. The pet's layers ignore touches, so habit taps never wait.

import type { PetMomentKind } from '@/rules/payoff';

export type PetMoment =
  /** The reaction hop (wake, Test tools). */
  | { kind: 'react' }
  /** A full-bar moment with its caption, petting, the affection purr, or a quest celebration. */
  | { kind: PetMomentKind; caption?: string };

type Listener = (moment: PetMoment) => void;

const queue: PetMoment[] = [];
let playing: PetMoment | null = null;
const requested = new Set<() => void>();
const started = new Set<Listener>();

export function requestPetMoment(moment: PetMoment): void {
  queue.push(moment);
  requested.forEach((l) => l());
}

/** The wake reaction and Test tools' "Bounce the pet". */
export const requestPetReaction = () => requestPetMoment({ kind: 'react' });

/** Petting: a purr, unless one is already playing or waiting, so tapping again can't pile up. */
export function requestPetting(): boolean {
  const purring = (m: PetMoment | null | undefined) => m?.kind === 'purr';
  if (purring(playing) || queue.some(purring)) return false;
  requestPetMoment({ kind: 'purr' });
  return true;
}

/** Moments that play while the pet sleeps: a quest's claim celebration (hearts over a sleeping
 * pet). Everything else waits until it wakes. */
export const playsAsleep = (m: PetMoment) => m.kind === 'celebrate';

/**
 * The next moment to play, or nothing. Marks it as playing and tells listeners. While the pet
 * sleeps, only a moment that plays asleep is taken; the rest stay queued in order.
 */
export function takePetMoment({ asleep = false }: { asleep?: boolean } = {}):
  PetMoment | undefined {
  if (asleep && queue[0] && !playsAsleep(queue[0])) return undefined;
  const next = queue.shift();
  playing = next ?? null;
  if (next) started.forEach((l) => l(next));
  return next;
}

/** The pet finished (or dropped) the moment it was playing. */
export function finishPetMoment(): void {
  playing = null;
}

export function isPetMomentPlaying(): boolean {
  return playing !== null;
}

/** Called when a moment is requested. Returns a function that stops listening. */
export function onPetMomentRequest(listener: () => void): () => void {
  requested.add(listener);
  return () => {
    requested.delete(listener);
  };
}

/** Called when a moment starts playing (the caption listens here). */
export function onPetMomentStart(listener: Listener): () => void {
  started.add(listener);
  return () => {
    started.delete(listener);
  };
}

const captions = new Set<(text: string) => void>();

/** A narrator line with no pet moment (Explore, P2-16): the caption above the bar shows it. */
export function announce(text: string): void {
  captions.forEach((l) => l(text));
}

export function onAnnounce(listener: (text: string) => void): () => void {
  captions.add(listener);
  return () => {
    captions.delete(listener);
  };
}

/** Tests only: empty the queue. */
export function resetPetMoments(): void {
  queue.length = 0;
  playing = null;
}
