import { describe, expect, it } from '@jest/globals';
import { createInitialState, trackerReducer, type TrackerState } from './state';

const DAY = '2026-10-25';
const start = (good = 3, bad = 0, limit = 5): TrackerState => {
  const state = createInitialState();
  return {
    ...state,
    habits: state.habits.map((h) => (h.id === 'sleep' ? { ...h, timesPerDay: limit } : h)),
    badHabits: [{ id: 'poor-sleep', name: 'Poor Sleep', pairedWith: 'sleep' }],
    log: { [DAY]: { sleep: good } },
    slips: { [DAY]: { 'poor-sleep': bad } },
  };
};
const set = (state: TrackerState, count: number) =>
  trackerReducer(state, { type: 'setSlips', date: DAY, badHabitId: 'poor-sleep', count });

describe('shared good and linked bad daily limit (#146)', () => {
  it('three good logs leave room for only two bad counts at a limit of five', () => {
    const full = set(start(), 2);
    expect(full.slips[DAY]?.['poor-sleep']).toBe(2);
    expect(set(full, 3)).toBe(full);
    expect(trackerReducer(full, { type: 'logSlip', date: DAY, badHabitId: 'poor-sleep' })).toBe(
      full,
    );
    expect(set(start(), 50).slips[DAY]?.['poor-sleep']).toBe(2);
    expect(full.log[DAY]?.sleep).toBe(3);
  });

  it('a full once-daily good log leaves no room for a linked slip', () => {
    const state = start(1, 0, 1);
    expect(set(state, 1)).toBe(state);
    expect(set(start(0, 0, 1), 2).slips[DAY]?.['poor-sleep']).toBe(1);
  });

  it('preserves old over-limit counts and allows gradual decreases', () => {
    const old = start(3, 5);
    expect(set(old, 6)).toBe(old);
    expect(old.slips[DAY]?.['poor-sleep']).toBe(5);
    const less = set(old, 4);
    expect(less.slips[DAY]?.['poor-sleep']).toBe(4);
    expect(set(less, 5)).toBe(less);
    expect(set(set(less, 1), 2).slips[DAY]?.['poor-sleep']).toBe(2);
  });

  it('does not limit standalone slips or unpaired Design 2 slips', () => {
    const state = start();
    const standalone = { ...state, badHabits: [{ id: 'poor-sleep', name: 'Poor Sleep' }] };
    expect(set(standalone, 50).slips[DAY]?.['poor-sleep']).toBe(50);
    const unpaired = trackerReducer(
      state,
      { type: 'setSlips', date: DAY, badHabitId: 'poor-sleep', count: 50 },
      'design2',
    );
    expect(unpaired.slips[DAY]?.['poor-sleep']).toBe(50);
  });

  it('keeps locked days unchanged', () => {
    const state = { ...start(), lockedThrough: DAY };
    expect(set(state, 1)).toBe(state);
  });
});
