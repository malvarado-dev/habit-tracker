import { describe, expect, it } from '@jest/globals';
import { createInitialState, trackerReducer } from './state';

const bad = { id: 'soda', name: 'Soda', pairedWith: 'sleep', addedOn: '2026-10-25' };
const initial = {
  ...createInitialState(),
  badHabits: [bad, { id: 'snacks', name: 'Snacks' }],
  slips: { '2026-10-25': { soda: 2 }, '2026-10-24': { soda: 1 } },
};

describe('Manage bad habits (#132)', () => {
  it('renames without losing pairing, added date or slips', () => {
    const next = trackerReducer(initial, {
      type: 'renameBadHabit',
      badHabitId: bad.id,
      name: 'Soft drinks',
    });
    expect(next.badHabits[0]).toEqual({ ...bad, name: 'Soft drinks' });
    expect(next.slips).toBe(initial.slips);
  });

  it.each(['', 'Sleep', 'Snacks', 'a'.repeat(21)])('rejects invalid name %s', (name) => {
    expect(trackerReducer(initial, { type: 'renameBadHabit', badHabitId: bad.id, name })).toBe(
      initial,
    );
  });

  it('changes or clears pairing, and rejects a missing partner by clearing it', () => {
    const next = trackerReducer(initial, {
      type: 'pairBadHabit',
      badHabitId: bad.id,
      pairedWith: 'diet',
    });
    expect(next.badHabits[0]!.pairedWith).toBe('diet');
    expect(next.slips).toBe(initial.slips);
    for (const pairedWith of [undefined, 'missing']) {
      const cleared = trackerReducer(next, {
        type: 'pairBadHabit',
        badHabitId: bad.id,
        pairedWith,
      });
      expect(cleared.badHabits[0]!.pairedWith).toBeUndefined();
    }
  });

  it('removes and restores in place with all slips and metadata kept', () => {
    const removed = trackerReducer(initial, { type: 'removeBadHabit', badHabitId: bad.id });
    expect(removed.badHabits).toEqual([initial.badHabits[1]]);
    expect(removed.slips).toBe(initial.slips);
    const restored = trackerReducer(removed, { type: 'restoreBadHabit', habit: bad, index: 0 });
    expect(restored).toEqual(initial);
    expect(trackerReducer(restored, { type: 'restoreBadHabit', habit: bad, index: 0 })).toBe(
      restored,
    );
  });

  it('allows more than 15 bad habits without consuming good-habit slots', () => {
    let state = createInitialState();
    for (let i = 0; i < 16; i++) {
      state = trackerReducer(state, {
        type: 'addBadHabit',
        id: `bad-${i}`,
        name: `Bad ${i}`,
        date: '2026-10-25',
      });
    }
    expect(state.badHabits).toHaveLength(16);
    expect(state.habits).toEqual(createInitialState().habits);
  });
});
