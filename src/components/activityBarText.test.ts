import { describe, expect, it } from '@jest/globals';

import { activityBarLabel, clampFill, justFilled } from './activityBarText';

describe('Activity Bar text (P2-08a)', () => {
  it('screen readers hear logs against the target, full, or Rest day', () => {
    expect(activityBarLabel(3, 5, false)).toBe('Activity Bar, 3 of 5 logs today');
    expect(activityBarLabel(5, 5, false)).toBe('Activity Bar full, 5 of 5 logs today');
    expect(activityBarLabel(7, 5, false)).toBe('Activity Bar full, 5 of 5 logs today');
    expect(activityBarLabel(0, 1, false)).toBe('Activity Bar, 0 of 1 log today');
    expect(activityBarLabel(0, 0, true)).toBe('Rest day, no habits to log');
  });

  it('clamps the fill to the bar', () => {
    expect(clampFill(1.2)).toBe(1);
    expect(clampFill(-0.1)).toBe(0);
    expect(clampFill(0.4)).toBe(0.4);
  });

  it('celebrates only on an upward move to full, never on a Rest day', () => {
    expect(justFilled(0.8, 1, false)).toBe(true);
    expect(justFilled(1, 1, false)).toBe(false);
    expect(justFilled(0, 0.9, false)).toBe(false);
    expect(justFilled(0.5, 1, true)).toBe(false);
  });
});
