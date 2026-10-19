import { describe, expect, it } from '@jest/globals';
import { tuning } from '@/config/tuning';
import {
  clampEnergy,
  energyLabel,
  energyMilestone,
  percentText,
  tickPositions,
} from './energyBarText';

describe('Energy bar text (T18, decided 2026-10-19)', () => {
  it('ticks sit at the B, A, and S cutoffs from the tuning file', () => {
    const { B, A, S } = tuning.rank.cutoffs;
    expect(tickPositions()).toEqual([B, A, S]);
  });

  it('shows a whole percent', () => {
    expect(percentText(0.6449)).toBe('64%');
    expect(percentText(1.2)).toBe('100%');
  });

  it('screen readers hear the percent and the marks, or Rest day', () => {
    expect(energyLabel(0.64, false)).toBe('64 percent of today. Marks at 50, 75, and 90 percent.');
    expect(energyLabel(1, true)).toBe('Rest day, no habits due');
  });

  it('clamps the fill to the bar', () => {
    expect(clampEnergy(1.2)).toBe(1);
    expect(clampEnergy(-0.1)).toBe(0);
    expect(clampEnergy(0.4)).toBe(0.4);
  });
});

describe('Energy bar celebrations', () => {
  it('crossing the top tick plays the shimmer, reaching 100% plays the bigger one', () => {
    expect(energyMilestone(0.8, 0.92, false)).toBe('top');
    expect(energyMilestone(0.95, 1, false)).toBe('full');
    expect(energyMilestone(0.5, 1, false)).toBe('full');
  });

  it('never on the way down, staying put, or a Rest day', () => {
    expect(energyMilestone(0.92, 0.95, false)).toBeNull();
    expect(energyMilestone(1, 0.8, false)).toBeNull();
    expect(energyMilestone(1, 1, false)).toBeNull();
    expect(energyMilestone(0, 1, true)).toBeNull();
  });
});
