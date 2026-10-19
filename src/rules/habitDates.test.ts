// T21: a day's score counts only habits active that day. A habit is active from the day it was
// added up to, but not including, the day it was removed (SPEC-00, History).
import { describe, expect, it } from '@jest/globals';

import { weekRows } from '@/features/history/historyModel';
import { loadSave } from '@/features/tracker/save';
import { createInitialState, trackerReducer, type TrackerState } from '@/features/tracker/state';

import { allHabits, historyDay, lockDays } from './locking';
import { existsOn, getDailyResult, type Habit } from './scoring';

// Weeks run Sunday to Saturday. Three extra habits live for one week: Sun Oct 4 to Sat Oct 10.
const ADDED = '2026-10-04';
const REMOVED = '2026-10-11';
const BEFORE = '2026-10-03';
const DURING = '2026-10-07';
const LAST_ACTIVE = '2026-10-10';
const AFTER = '2026-10-14';
const EXTRA = ['read', 'walk', 'stretch'];

function withExtraWeek(): TrackerState {
  let state = createInitialState();
  for (const id of EXTRA) {
    state = trackerReducer(state, { type: 'addHabit', id, name: id, date: ADDED });
  }
  for (const id of EXTRA) {
    state = trackerReducer(state, { type: 'removeHabit', habitId: id, date: REMOVED });
  }
  return state;
}

const possible = (state: TrackerState, date: string) =>
  getDailyResult(allHabits(state), state.log, date).possibleStars;

describe('habit active dates (T21)', () => {
  it('a habit is active from the day it was added until the day it was removed', () => {
    const habit: Habit = {
      id: 'x',
      name: 'X',
      color: 'habit1',
      goal: { kind: 'anyDays', timesPerWeek: 3 },
      addedOn: ADDED,
      removedOn: REMOVED,
    };
    expect(existsOn(habit, BEFORE)).toBe(false);
    expect(existsOn(habit, ADDED)).toBe(true);
    expect(existsOn(habit, LAST_ACTIVE)).toBe(true);
    expect(existsOn(habit, REMOVED)).toBe(false);
    expect(existsOn({ ...habit, addedOn: undefined, removedOn: undefined }, BEFORE)).toBe(true);
  });

  it('removing keeps the habit with its removed date, off the active list', () => {
    const state = withExtraWeek();
    expect(state.habits.map((h) => h.id)).toEqual(['sleep', 'diet', 'exercise', 'wellbeing']);
    expect(state.removed.map((h) => [h.id, h.removedOn])).toEqual(EXTRA.map((id) => [id, REMOVED]));
  });

  it('adding 3 habits for one week changes only that week; earlier and later days use their own habits', () => {
    const state = withExtraWeek();
    // Starters due every day: Sleep, Diet, Wellbeing (3 x 3 stars). The extras add 3 x 3 more.
    expect(possible(state, BEFORE)).toBe(9);
    expect(possible(state, ADDED)).toBe(18);
    expect(possible(state, DURING)).toBe(18);
    expect(possible(state, LAST_ACTIVE)).toBe(18);
    expect(possible(state, REMOVED)).toBe(9);
    expect(possible(state, AFTER)).toBe(9);
  });

  it('scoring a removed habit on a day it was active counts for that day', () => {
    let state = withExtraWeek();
    for (const id of ['sleep', 'diet', 'wellbeing', ...EXTRA]) {
      state = trackerReducer(state, {
        type: 'setCheckIn',
        date: DURING,
        habitId: id,
        checkIn: 'NailedIt',
      });
    }
    expect(historyDay(state, DURING)).toMatchObject({ outcome: 'rank', rank: 'S' });
    expect(historyDay(state, DURING).earnedStars).toBe(18);
  });

  it('a day that locks after the removal still counts the removed habits', () => {
    let state = withExtraWeek();
    state = trackerReducer(state, {
      type: 'setCheckIn',
      date: DURING,
      habitId: 'sleep',
      checkIn: 'NailedIt',
    });
    state = lockDays(state, '2026-10-19');
    expect(state.locked[DURING]).toMatchObject({ earnedStars: 3, possibleStars: 18, rank: 'C' });
  });

  it('removing a habit the same day it was added leaves no trace', () => {
    let state = createInitialState();
    state = trackerReducer(state, { type: 'addHabit', id: 'read', name: 'Read', date: ADDED });
    state = trackerReducer(state, { type: 'removeHabit', habitId: 'read', date: ADDED });
    expect(state.removed).toEqual([]);
    expect(possible(state, ADDED)).toBe(9);
  });

  it('Undo brings the habit back active with no removed date', () => {
    const before = trackerReducer(createInitialState(), {
      type: 'addHabit',
      id: 'read',
      name: 'Read',
      date: ADDED,
    });
    const habit = before.habits.find((h) => h.id === 'read')!;
    const removed = trackerReducer(before, { type: 'removeHabit', habitId: 'read', date: DURING });
    const undone = trackerReducer(removed, {
      type: 'restoreHabit',
      habit: removed.removed[0]!,
      index: 4,
    });
    expect(undone.removed).toEqual([]);
    expect(undone.habits[4]).toEqual(habit);
    expect(undone.habits[4]!.removedOn).toBeUndefined();
  });

  it('the History week panel shows a removed habit only for weeks it was active', () => {
    const state = withExtraWeek();
    const ids = (date: string) => weekRows(allHabits(state), state.log, date).map((r) => r.habitId);
    expect(ids(DURING)).toEqual(expect.arrayContaining(EXTRA));
    expect(ids(AFTER)).not.toEqual(expect.arrayContaining(['read']));
    expect(ids(BEFORE)).not.toContain('read');
  });
});

describe('save version 7 (T21)', () => {
  it('upgrades v6 by adding an empty removed list and copying the rest exactly', () => {
    const v6 = { ...createInitialState(), version: 6, removed: undefined };
    delete (v6 as Record<string, unknown>).removed;
    v6.log = { [DURING]: { sleep: 'NailedIt' } };
    const result = loadSave(JSON.stringify(v6));
    expect(result).toEqual({
      kind: 'loaded',
      state: { ...v6, version: 7, removed: [] },
      upgradedFrom: 6,
    });
  });

  it('loads a v7 save with removed habits as is', () => {
    const state = withExtraWeek();
    expect(loadSave(JSON.stringify(state))).toEqual({ kind: 'loaded', state, upgradedFrom: null });
  });

  it('a v7 save missing its removed list is kept as unreadable, never dropped', () => {
    const broken = { ...createInitialState() } as Record<string, unknown>;
    delete broken.removed;
    const raw = JSON.stringify(broken);
    expect(loadSave(raw)).toEqual({ kind: 'unreadable', raw });
  });
});
