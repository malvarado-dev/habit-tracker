import { describe, expect, it } from '@jest/globals';
import { energyFraction, energyLabel } from './energyBarText';

describe('Energy bar (SPEC-00, T7)', () => {
  it('screen reader hears "3 of 4 habits checked in"', () => {
    expect(energyLabel(3, 4)).toBe('3 of 4 habits checked in');
  });

  it.each([
    [0, 4, 0],
    [3, 4, 0.75],
    [4, 4, 1],
  ])('%i of %i fills %f of the bar', (checkedIn, due, fraction) => {
    expect(energyFraction(checkedIn, due)).toBe(fraction);
  });

  it('never fills past the flag or below empty', () => {
    expect(energyFraction(5, 4)).toBe(1);
    expect(energyFraction(-1, 4)).toBe(0);
  });

  it('a Rest day shows a full bar and says so', () => {
    expect(energyFraction(0, 0)).toBe(1);
    expect(energyLabel(0, 0)).toBe('Rest day, no habits due');
  });
});
