import { describe, expect, it } from '@jest/globals';

import { appReducer, createAppState, type AppState } from '@/features/tracker/modes';
import { createInitialState, trackerReducer } from '@/features/tracker/state';

import { streaks } from './historyModel';

// History edits (P2-18b). Real date: Mon Oct 26, 2026. Today and the 2 days before can change.
const REAL = '2026-10-26';

function edit(app: AppState, date: string, habitId: string): AppState {
  return appReducer(app, {
    type: 'tracker',
    realDate: REAL,
    action: { type: 'logHabit', date, habitId },
  });
}

describe('History edits (P2-18b)', () => {
  it('resets and restores exact good logs without changing linked slips or other habits', () => {
    const original = {
      ...createInitialState(),
      log: { [REAL]: { sleep: 4, diet: 1 } },
      badHabits: [{ id: 'poor-sleep', name: 'Poor Sleep', pairedWith: 'sleep' }],
      slips: { [REAL]: { 'poor-sleep': 1 } },
    };
    const reset = trackerReducer(original, {
      type: 'setHistoryLogs',
      date: REAL,
      habitId: 'sleep',
      count: 0,
    });
    expect(reset.log[REAL]).toEqual({ diet: 1 });
    expect(reset.slips).toEqual(original.slips);
    const restored = trackerReducer(reset, {
      type: 'setHistoryLogs',
      date: REAL,
      habitId: 'sleep',
      count: 4,
    });
    expect(restored.log).toEqual(original.log);
    expect(restored.slips).toEqual(original.slips);
  });

  it('refuses History count changes on locked days and rejects invalid counts', () => {
    const original = { ...createInitialState(), log: { [REAL]: { sleep: 3 } } };
    const locked = { ...original, lockedThrough: REAL };
    expect(
      trackerReducer(locked, { type: 'setHistoryLogs', date: REAL, habitId: 'sleep', count: 0 }),
    ).toBe(locked);
    for (const count of [-1, 0.5, NaN, Infinity]) {
      expect(
        trackerReducer(original, { type: 'setHistoryLogs', date: REAL, habitId: 'sleep', count }),
      ).toBe(original);
    }
  });
  it('an edit inside the window lands', () => {
    const app = edit(createAppState(), '2026-10-24', 'sleep');
    expect(app.real.state.log['2026-10-24']?.sleep).toBe(1);
  });

  it('an edit to a locked day is refused in Real', () => {
    const app = edit(createAppState(), '2026-10-23', 'sleep');
    expect(app.real.state.log['2026-10-23']).toBeUndefined();
  });

  it('filling a past day adds it to the streak right away', () => {
    // The default habits are Sleep, Diet, Exercise and Wellbeing; three of four fill the bar.
    let app = createAppState();
    const before = streaks(app.real.state, REAL).current;
    for (const id of ['sleep', 'diet', 'exercise']) app = edit(app, '2026-10-25', id);
    expect(streaks(app.real.state, REAL).current).toBe(before + 1);
  });
});
