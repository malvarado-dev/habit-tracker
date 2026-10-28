import { describe, expect, it } from '@jest/globals';

import { createInitialState, type TrackerState } from '@/features/tracker/state';
import { lockDays } from '@/rules/locking';

import {
  dayHeaderText,
  dayTitle,
  monthGrid,
  streakBand,
  streakRuns,
  streaks,
  streakText,
} from './historyModel';

// Monday 2026-10-19 is today. Sleep, Diet and Wellbeing are due every day: 2 of 3 fill the bar.
const TODAY = '2026-10-19';
const FULL = { sleep: 1, diet: 1 };

function state(fullDays: string[]): TrackerState {
  const log = Object.fromEntries(fullDays.map((d) => [d, FULL]));
  return lockDays({ ...createInitialState(), log }, TODAY);
}

describe('streak band (P2-18a)', () => {
  it('paints one continuous run with separate shapes at gaps and week edges', () => {
    expect(streakRuns(['none', 'start', 'middle', 'end', 'none', 'start', 'end'])).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 6 },
    ]);
    expect(streakRuns(['single', 'none', 'single'])).toEqual([
      { start: 0, end: 0 },
      { start: 2, end: 2 },
    ]);
    expect(streakRuns(['none', 'none'])).toEqual([]);
  });
  it('joins a run in a row and wraps it across the week edge', () => {
    // Fri Oct 16, Sat Oct 17 end one row; Sun Oct 18 starts the next.
    const s = state(['2026-10-16', '2026-10-17', '2026-10-18']);
    const weeks = monthGrid('2026-10', s, TODAY);
    const band = streakBand(weeks, s);
    expect(band[2]!.slice(5)).toEqual(['start', 'end']);
    // Oct 18 starts the next row alone (today, Oct 19, isn't filled yet).
    expect(band[3]![0]).toBe('single');
  });

  it('a lone filled day is single, and a three-day run has a middle', () => {
    const s = state(['2026-10-06', '2026-10-08', '2026-10-09', '2026-10-10']);
    const band = streakBand(monthGrid('2026-10', s, TODAY), s);
    expect(band[1]!.slice(2)).toEqual(['single', 'none', 'start', 'middle', 'end']);
  });
});

describe('streak counts (P2-18a)', () => {
  it('an unfilled today does not break the current streak', () => {
    expect(streaks(state(['2026-10-17', '2026-10-18']), TODAY)).toEqual({ current: 2, best: 2 });
  });

  it('a filled today counts', () => {
    const s = state(['2026-10-17', '2026-10-18', TODAY]);
    expect(streaks(s, TODAY).current).toBe(3);
  });

  it('best keeps the longest run, across months', () => {
    const s = state(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-18']);
    expect(streaks(s, TODAY)).toEqual({ current: 1, best: 4 });
    expect(streakText(streaks(s, TODAY))).toBe('1 day streak · Best 4');
  });

  it('a missed day ends the current streak', () => {
    expect(streaks(state(['2026-10-16', '2026-10-17']), TODAY).current).toBe(0);
  });
});

describe('day header (P2-18a)', () => {
  it('titles today and past days', () => {
    expect(dayTitle(TODAY, TODAY)).toBe('Today, Mon Oct 19');
    expect(dayTitle('2026-10-15', TODAY)).toBe('Thu, Oct 15');
  });

  it('counts down the edit window, then locks', () => {
    const s = state([]);
    const text = (d: string) =>
      dayHeaderText(d, TODAY, s.lockedThrough, 2, new Date(2026, 9, 19, 10)).text;
    expect(text(TODAY)).toBe('3 days left to edit');
    expect(text('2026-10-18')).toBe('2 days left to edit');
    expect(text('2026-10-17')).toBe('14 hours left to edit');
    expect(text('2026-10-16')).toBe('Locked in');
  });
});
