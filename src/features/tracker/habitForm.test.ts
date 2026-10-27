import { describe, expect, it } from '@jest/globals';
import { tuning } from '@/config/tuning';
import { timesPerDay } from '@/rules/habits';
import { createInitialState, trackerReducer } from './state';

describe('habit form frequency (#131)', () => {
  it.each([
    [-1, 1],
    [3, 3],
    [99, tuning.activityBar.timesPerDayMax],
  ])('adds a habit with %s times per day clamped to %s', (input, expected) => {
    const state = trackerReducer(createInitialState(), {
      type: 'addHabit',
      id: 'water',
      name: 'Water',
      date: '2026-10-25',
      timesPerDay: input,
    });
    expect(timesPerDay(state.habits.find((h) => h.id === 'water')!)).toBe(expected);
  });

  it('lowering frequency keeps all logs and the existing color', () => {
    const initial = createInitialState();
    const state = { ...initial, log: { '2026-10-25': { sleep: 3 } } };
    const next = trackerReducer(state, { type: 'setTimesPerDay', habitId: 'sleep', times: 2 });
    expect(next.log).toEqual(state.log);
    expect(next.habits[0]).toEqual({ ...state.habits[0], timesPerDay: 2 });
  });
});
