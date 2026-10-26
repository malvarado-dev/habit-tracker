import { describe, expect, it } from '@jest/globals';

import { appReducer, createAppState } from '@/features/tracker/modes';

import { DAY_EDITS, isStaleTap } from './dayOnScreen';

// Today was left open on Sun Oct 25 at 11:58 PM; the real date is now Mon Oct 26.
const SHOWN = '2026-10-25';
const REAL = '2026-10-26';

describe('logs count toward the day on screen (P2-18a)', () => {
  it('a log made after midnight on a screen still showing yesterday counts toward yesterday', () => {
    const app = appReducer(createAppState(), {
      type: 'tracker',
      realDate: REAL,
      action: { type: 'logHabit', date: SHOWN, habitId: 'sleep' },
    });
    expect(app.real.state.log[SHOWN]?.sleep).toBe(1);
    expect(app.real.state.log[REAL]).toBeUndefined();
  });

  it('a stale screen still inside the edit window logs normally', () => {
    expect(isStaleTap(SHOWN, REAL, 2)).toBe(false);
    expect(isStaleTap('2026-10-24', REAL, 2)).toBe(false);
  });

  it('a screen whose day has locked refreshes Today instead of logging', () => {
    expect(isStaleTap('2026-10-23', REAL, 2)).toBe(true);
  });

  it('only day edits are checked; adding a habit is not', () => {
    expect(DAY_EDITS.has('logHabit')).toBe(true);
    expect(DAY_EDITS.has('setSlips')).toBe(true);
    expect(DAY_EDITS.has('addHabit')).toBe(false);
  });
});
