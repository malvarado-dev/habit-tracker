import { describe, expect, it } from '@jest/globals';

import { appReducer, createAppState, type AppState } from '@/features/tracker/modes';

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
