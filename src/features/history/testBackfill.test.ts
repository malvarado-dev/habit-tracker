/// <reference types="node" />
// T22: Test mode keeps today and the 45 days before it open, so History can be filled in fast.
// Older days can't be opened in Test, and the month arrows stop at the oldest open day's month.
// Real keeps the 2-day lock and is never changed by Test (SPEC-00, Test-only area).
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

import { calendar } from '@/config/calendar';
import {
  appReducer,
  createAppState,
  oldestOpenableDay,
  openDaysFor,
  type AppAction,
  type AppState,
} from '@/features/tracker/modes';
import { addDays } from '@/rules/dates';
import { historyDay, lastLockedDay } from '@/rules/locking';

import {
  canOpenDay,
  dayCellLabel,
  dayStatusText,
  monthGrid,
  monthLimits,
  stepMonth,
} from './historyModel';

const REAL = '2026-10-19';
const OLDEST = '2026-09-04'; // 45 days before Oct 19
const TOO_OLD = '2026-09-03';

const run = (start: AppState, ...actions: AppAction[]) => actions.reduce(appReducer, start);
const logHabit = (date: string, habitId: string): AppAction => ({
  type: 'tracker',
  realDate: REAL,
  action: { type: 'logHabit', date, habitId },
});

describe('Test open window (T22)', () => {
  it('Test keeps 45 days open; Real keeps 2', () => {
    expect(calendar.testOpenDaysBeforeToday).toBe(45);
    expect(openDaysFor('test')).toBe(45);
    expect(openDaysFor('real')).toBe(2);
    expect(lastLockedDay(REAL, 45)).toBe(addDays(OLDEST, -1));
    expect(lastLockedDay(REAL)).toBe('2026-10-16');
  });

  it('the oldest day Test can open is 45 days back; Real has no limit', () => {
    expect(oldestOpenableDay('test', REAL)).toBe(OLDEST);
    expect(oldestOpenableDay('real', REAL)).toBeNull();
    expect(canOpenDay(OLDEST, REAL, OLDEST)).toBe(true);
    expect(canOpenDay(TOO_OLD, REAL, OLDEST)).toBe(false);
    expect(canOpenDay('2020-01-01', REAL, null)).toBe(true);
    expect(canOpenDay('2026-10-20', REAL, null)).toBe(false);
  });

  it('a log 45 days back in Test is saved and counts for the day', () => {
    const app = run(createAppState(), { type: 'setMode', mode: 'test' }, logHabit(OLDEST, 'sleep'));
    expect(app.test.state.log[OLDEST]).toEqual({ sleep: 1 });
    expect(historyDay(app.test.state, OLDEST)).toMatchObject({ logs: 1 });
  });

  it('a log older than the window is ignored in Test', () => {
    const app = run(
      createAppState(),
      { type: 'setMode', mode: 'test' },
      logHabit(TOO_OLD, 'sleep'),
    );
    expect(app.test.state.log[TOO_OLD]).toBeUndefined();
  });

  it('Real still locks after 2 days and never gets Test logs', () => {
    const app = run(createAppState(), logHabit('2026-10-10', 'sleep'));
    expect(app.real.state.log['2026-10-10']).toBeUndefined();
    const both = run(
      createAppState(),
      { type: 'setMode', mode: 'test' },
      logHabit('2026-10-10', 'sleep'),
    );
    expect(both.real.state.log).toEqual({});
  });
});

describe('History in Test (T22)', () => {
  it('the month arrows reach the oldest open month even with no data, and no further', () => {
    expect(monthLimits('2026-10', {}, REAL, OLDEST)).toEqual({ canPrev: true, canNext: false });
    expect(monthLimits('2026-09', {}, REAL, OLDEST)).toEqual({ canPrev: false, canNext: true });
    expect(stepMonth('2026-10', -1, {}, REAL, OLDEST)).toBe('2026-09');
    expect(stepMonth('2026-09', -1, {}, REAL, OLDEST)).toBe('2026-09');
    // Real with no data stays on this month, as before.
    expect(monthLimits('2026-10', {}, REAL)).toEqual({ canPrev: false, canNext: false });
  });

  it('days older than the window are faint and cannot be opened, with a clear label', () => {
    const state = createAppState().test.state;
    const cells = monthGrid('2026-09', state, REAL, OLDEST).flat();
    const tooOld = cells.find((c) => c.date === TOO_OLD)!;
    const oldest = cells.find((c) => c.date === OLDEST)!;
    expect(tooOld.kind).toBe('tooOld');
    expect(tooOld.result).toBeUndefined();
    expect(dayCellLabel(tooOld)).toBe('Thu, Sep 3, too far back to open in Test');
    expect(oldest.kind).toBe('day');
    // Real shows the same day as a normal past day.
    const real = monthGrid('2026-09', state, REAL)
      .flat()
      .find((c) => c.date === TOO_OLD)!;
    expect(real.kind).toBe('day');
  });

  it('Test: days past the real 2-day window read "Habits locked in" but stay open (T24)', () => {
    const noon = new Date(2026, 9, 19, 12);
    expect(dayStatusText(OLDEST, REAL, null, 45, noon)).toEqual({
      locked: false,
      text: 'Habits locked in',
    });
    expect(dayStatusText('2026-10-01', REAL, null, 45, noon)).toEqual({
      locked: false,
      text: 'Habits locked in',
    });
    // The last 2 days still count down in Test.
    expect(dayStatusText(REAL, REAL, null, 45, noon).text).toMatch(/^Habits lock in \d+hrs$/);
    // Past the 45-day window, and in Real past 2 days: locked.
    expect(dayStatusText(TOO_OLD, REAL, null, 45, noon)).toEqual({
      locked: true,
      text: 'Habits locked in',
    });
    expect(dayStatusText('2026-10-10', REAL, null, 2, noon)).toEqual({
      locked: true,
      text: 'Habits locked in',
    });
  });

  it('History passes the Test window through to the calendar', () => {
    const read = (p: string) => readFileSync(join(__dirname, p), 'utf8');
    const view = read('../../components/history/HistoryView.tsx');
    expect(view).toContain('monthGrid(month, state, today, oldestDay)');
    expect(view).toContain('monthLimits(month, state.log, today, oldestDay)');
  });
});
