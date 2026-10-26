import { describe, expect, it } from '@jest/globals';
import { critterLabel, critterMood, randomGap } from './critterMood';

describe('critter faces follow the Activity Bar (P2-08a)', () => {
  it.each([
    ['asleep', false, 'asleep'],
    ['asleep', true, 'flat'],
    ['rest', false, 'flat'],
    ['awake', false, 'smile'],
    ['full', false, 'big'],
  ] as const)('%s sky, woken %s, gives a %s face', (level, woken, mood) => {
    expect(critterMood(level, woken)).toBe(mood);
  });

  it('screen reader hears the mood', () => {
    expect(critterLabel('asleep')).toBe(
      'Your critter is asleep. Tap it or check in to wake it up.',
    );
    expect(critterLabel('big')).toBe('Your critter is delighted.');
  });
});

describe('random gaps', () => {
  it('stays inside its range', () => {
    expect(randomGap(2500, 6000, () => 0)).toBe(2500);
    expect(randomGap(2500, 6000, () => 1)).toBe(6000);
    expect(randomGap(2500, 6000, () => 0.5)).toBe(4250);
  });
});
