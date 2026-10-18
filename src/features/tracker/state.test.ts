import { describe, expect, it } from '@jest/globals';
import { createInitialState, isTrackerState, trackerReducer, type TrackerState } from './state';

const MON = '2026-10-12';

function apply(state: TrackerState, ...actions: Parameters<typeof trackerReducer>[1][]) {
  return actions.reduce(trackerReducer, state);
}

describe('trackerReducer', () => {
  it('starts with the four prototype habits, Beginner mode, and an unhatched egg', () => {
    const state = createInitialState();
    expect(state.habits.map((h) => `${h.name} ${h.weeklyTarget}`)).toEqual([
      'Sleep 7',
      'Diet 7',
      'Exercise 3',
      'Wellbeing 7',
    ]);
    expect(state.mode).toBe('Beginner');
    expect(state.hatched).toBe(false);
  });

  it('the first tap checks in On track and hatches the egg', () => {
    const state = apply(createInitialState(), { type: 'tapHabit', date: MON, habitId: 'sleep' });
    expect(state.log[MON]?.sleep).toBe('OnTrack');
    expect(state.hatched).toBe(true);
  });

  it('repeated taps follow the cycle', () => {
    const tap = { type: 'tapHabit', date: MON, habitId: 'sleep' } as const;
    const state = apply(createInitialState(), tap, tap, tap, tap);
    expect(state.log[MON]?.sleep).toBe('Started');
  });

  it('swipes set a check-in directly', () => {
    const state = apply(createInitialState(), {
      type: 'setCheckIn',
      date: MON,
      habitId: 'diet',
      checkIn: 'NailedIt',
    });
    expect(state.log[MON]?.diet).toBe('NailedIt');
  });

  it('Next day records the mode the day was played in and moves forward', () => {
    const state = apply(
      createInitialState(),
      { type: 'setMode', mode: 'Pro' },
      { type: 'nextDay', today: MON },
    );
    expect(state.dayModes[MON]).toBe('Pro');
    expect(state.dayOffset).toBe(1);
  });

  it('adds a trimmed habit and ignores a blank one', () => {
    const added = apply(createInitialState(), { type: 'addHabit', id: 'read', name: '  Reading ' });
    expect(added.habits.at(-1)).toEqual({ id: 'read', name: 'Reading', weeklyTarget: 7 });
    const blank = apply(createInitialState(), { type: 'addHabit', id: 'x', name: '   ' });
    expect(blank.habits).toHaveLength(4);
  });

  it('keeps weekly targets between 1 and 7', () => {
    const low = apply(createInitialState(), {
      type: 'setWeeklyTarget',
      habitId: 'sleep',
      weeklyTarget: 0,
    });
    const high = apply(createInitialState(), {
      type: 'setWeeklyTarget',
      habitId: 'sleep',
      weeklyTarget: 9,
    });
    expect(low.habits[0]?.weeklyTarget).toBe(1);
    expect(high.habits[0]?.weeklyTarget).toBe(7);
  });

  it('never removes the last habit', () => {
    let state = createInitialState();
    for (const habit of state.habits) {
      state = trackerReducer(state, { type: 'removeHabit', habitId: habit.id });
    }
    expect(state.habits).toHaveLength(1);
  });

  it('reset goes back to a fresh start', () => {
    const state = apply(
      createInitialState(),
      { type: 'tapHabit', date: MON, habitId: 'sleep' },
      { type: 'reset' },
    );
    expect(state).toEqual(createInitialState());
  });
});

describe('isTrackerState', () => {
  it('accepts a fresh state and rejects junk', () => {
    expect(isTrackerState(createInitialState())).toBe(true);
    expect(isTrackerState(null)).toBe(false);
    expect(isTrackerState({ version: 2 })).toBe(false);
  });
});
