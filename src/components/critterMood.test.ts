import { describe, expect, it } from '@jest/globals';
import { critterLabel, critterMood, randomGap } from './critterMood';

describe('acceptance: critter faces by rank (T15, critter.md)', () => {
  it.each([
    ['asleep', false, 'asleep'],
    ['asleep', true, 'flat'],
    ['C', false, 'asleep'],
    ['C', true, 'flat'],
    ['rest', false, 'flat'],
    ['B', false, 'smile'],
    ['A', false, 'big'],
    ['S', false, 'big'],
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
