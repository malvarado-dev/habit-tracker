import { describe, expect, it } from '@jest/globals';
import { critterLabel, critterMood, randomGap } from './critterMood';

describe('critter mood (critter.md, T8)', () => {
  it.each([
    ['asleep', 'asleep'],
    ['rest', 'okay'],
    ['C', 'okay'],
    ['B', 'happy'],
    ['A', 'happy'],
    ['S', 'delighted'],
  ] as const)('%s sky gives a %s critter', (level, mood) => {
    expect(critterMood(level)).toBe(mood);
  });

  it('screen reader hears the mood', () => {
    expect(critterLabel('asleep')).toBe('Your critter is asleep. Check in to wake it up.');
    expect(critterLabel('delighted')).toBe('Your critter is delighted.');
  });
});

describe('random gaps', () => {
  it('stays inside its range', () => {
    expect(randomGap(2500, 6000, () => 0)).toBe(2500);
    expect(randomGap(2500, 6000, () => 1)).toBe(6000);
    expect(randomGap(2500, 6000, () => 0.5)).toBe(4250);
  });
});
