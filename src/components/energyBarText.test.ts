import { describe, expect, it } from '@jest/globals';
import { tuning } from '@/config/tuning';
import { clampEnergy, energyLabel, flagPosition } from './energyBarText';

describe('Energy bar (stars, decided 2026-10-18)', () => {
  it('screen reader hears the stars and where S is', () => {
    expect(energyLabel(7, 12, false)).toBe('7 of 12 stars. S rank at 90 percent.');
  });

  it('a Rest day says so', () => {
    expect(energyLabel(0, 0, true)).toBe('Rest day, no habits due');
  });

  it('the flag stands at the S cutoff and follows tuning', () => {
    const cutoffs = tuning.rank.cutoffs as { S: number };
    expect(flagPosition()).toBe(0.9);
    const original = cutoffs.S;
    cutoffs.S = 0.85;
    expect(flagPosition()).toBe(0.85);
    expect(energyLabel(1, 2, false)).toContain('S rank at 85 percent');
    cutoffs.S = original;
  });

  it('never fills past the end or below empty', () => {
    expect(clampEnergy(1.2)).toBe(1);
    expect(clampEnergy(-0.1)).toBe(0);
    expect(clampEnergy(0.4)).toBe(0.4);
  });
});
