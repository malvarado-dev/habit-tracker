import { describe, expect, it } from '@jest/globals';

import { hasHabitLog, petPlace } from './petPlace';

describe('pet spot rule (P2-12)', () => {
  it.each([
    [9, false, 'hide', 'behindBed'],
    [10, false, 'bed', 'inBed'],
    [25, false, 'bed', 'inBed'],
    [26, false, 'bed', 'inBed'],
    [9, true, 'hide', 'behindBed'],
    [10, true, 'bedAwake', 'inBed'],
    [25, true, 'bedAwake', 'inBed'],
    [26, true, 'room', 'front'],
  ] as const)('Confidence %i, logged %s: %s (%s)', (confidence, logged, spot, layer) => {
    expect(petPlace(confidence, logged)).toEqual({ spot, layer });
  });
});

describe('what wakes the pet', () => {
  it('a habit log today does', () => {
    expect(hasHabitLog({ '2026-10-26': { water: 1 } }, '2026-10-26')).toBe(true);
  });

  it('no logs, a log undone to 0, or a log on another day do not', () => {
    expect(hasHabitLog({}, '2026-10-26')).toBe(false);
    expect(hasHabitLog({ '2026-10-26': { water: 0 } }, '2026-10-26')).toBe(false);
    expect(hasHabitLog({ '2026-10-25': { water: 2 } }, '2026-10-26')).toBe(false);
  });
});
