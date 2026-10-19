import { describe, expect, it } from '@jest/globals';
import { getRank } from './rank';

describe('getRank (one set of cutoffs: S 90, A 75, B 50)', () => {
  it.each([
    [1, 'S'],
    [0.9, 'S'],
    [0.89, 'A'],
    [0.75, 'A'],
    [0.74, 'B'],
    [0.5, 'B'],
    [0.49, 'C'],
    [0, 'C'],
  ])('score %d gives rank %s', (score, expected) => {
    expect(getRank(score)).toBe(expected);
  });

  it.each([-0.1, 1.1, Number.NaN])('rejects an impossible score: %d', (score) => {
    expect(() => getRank(score)).toThrow(RangeError);
  });
});
