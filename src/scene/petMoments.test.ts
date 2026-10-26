// P2-14 (#85): the pet's moment queue. Top risks: moments overlapping, and petting piling up.

import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  finishPetMoment,
  isPetMomentPlaying,
  onPetMomentRequest,
  onPetMomentStart,
  requestPetMoment,
  requestPetReaction,
  requestPetting,
  resetPetMoments,
  takePetMoment,
  type PetMoment,
} from './petMoments';

beforeEach(resetPetMoments);

describe('pet moment queue', () => {
  it('plays requests one at a time, in order (AC 3)', () => {
    requestPetReaction();
    requestPetMoment({ kind: 'eat', caption: 'Ate' });
    expect(takePetMoment()).toEqual({ kind: 'react' });
    expect(isPetMomentPlaying()).toBe(true);
    finishPetMoment();
    expect(takePetMoment()).toEqual({ kind: 'eat', caption: 'Ate' });
    finishPetMoment();
    expect(takePetMoment()).toBeUndefined();
    expect(isPetMomentPlaying()).toBe(false);
  });

  it('tells listeners when a moment is asked for and when it starts', () => {
    let asked = 0;
    const startedWith: PetMoment[] = [];
    const offAsk = onPetMomentRequest(() => asked++);
    const offStart = onPetMomentStart((m) => startedWith.push(m));
    requestPetMoment({ kind: 'pounce' });
    takePetMoment();
    offAsk();
    offStart();
    requestPetReaction();
    takePetMoment();
    expect(asked).toBe(1);
    expect(startedWith).toEqual([{ kind: 'pounce' }]);
  });

  it('petting purrs, but not while a purr is playing or waiting (AC 4)', () => {
    expect(requestPetting()).toBe(true);
    expect(requestPetting()).toBe(false);
    takePetMoment();
    expect(requestPetting()).toBe(false);
    finishPetMoment();
    expect(requestPetting()).toBe(true);
  });
});
