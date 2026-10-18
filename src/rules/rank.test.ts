import { describe, expect, it } from '@jest/globals';
import { getRank, type Mode } from './rank';

describe('getRank', () => {
  it.each<[Mode, number, string]>([
    ['Beginner', 1, 'S'],
    ['Beginner', 0.8, 'S'],
    ['Beginner', 0.79, 'A'],
    ['Beginner', 0.6, 'A'],
    ['Beginner', 0.35, 'B'],
    ['Beginner', 0.34, 'C'],
    ['Beginner', 0, 'C'],
    ['Challenger', 0.9, 'S'],
    ['Challenger', 0.89, 'A'],
    ['Challenger', 0.75, 'A'],
    ['Challenger', 0.5, 'B'],
    ['Challenger', 0.49, 'C'],
    ['Pro', 0.95, 'S'],
    ['Pro', 0.94, 'A'],
    ['Pro', 0.85, 'A'],
    ['Pro', 0.65, 'B'],
    ['Pro', 0.64, 'C'],
  ])('%s mode, score %d gives rank %s', (mode, score, expected) => {
    expect(getRank(score, mode)).toBe(expected);
  });

  it('gives a lower rank for the same score in a harder mode', () => {
    expect(getRank(0.85, 'Beginner')).toBe('S');
    expect(getRank(0.85, 'Challenger')).toBe('A');
    expect(getRank(0.85, 'Pro')).toBe('A');
  });

  it.each([-0.1, 1.1, Number.NaN])('rejects an impossible score: %d', (score) => {
    expect(() => getRank(score, 'Beginner')).toThrow(RangeError);
  });
});
