// T21: a day's Activity Bar counts only habits active that day. A habit is active from the day it was
// added up to, but not including, the day it was removed (SPEC-00, History).
import { describe, expect, it } from '@jest/globals';

import { loadSave } from '@/features/tracker/save';
import { createInitialState, trackerReducer, type TrackerState } from '@/features/tracker/state';

import { allHabits, historyDay, lockDays } from './locking';
import { possibleLogs } from './activityBar';
import { existsOn, type Habit } from './habits';

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

const possible = (state: TrackerState, date: string) => possibleLogs(allHabits(state), date);

describe('habit active dates (T21)', () => {
  it('a habit is active from the day it was added until the day it was removed', () => {
    const habit: Habit = {
      id: 'x',
      name: 'X',
      color: 'habit1',
      schedule: { kind: 'anyDays' },
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
    // Starters due every day: Sleep, Diet, Wellbeing (3 logs). The extras add 3 more.
    expect(possible(state, BEFORE)).toBe(3);
    expect(possible(state, ADDED)).toBe(6);
    expect(possible(state, DURING)).toBe(6);
    expect(possible(state, LAST_ACTIVE)).toBe(6);
    expect(possible(state, REMOVED)).toBe(3);
    expect(possible(state, AFTER)).toBe(3);
  });

  it('logging a removed habit on a day it was active counts for that day', () => {
    let state = withExtraWeek();
    for (const id of ['sleep', 'diet', 'wellbeing', ...EXTRA]) {
      state = trackerReducer(state, { type: 'logHabit', date: DURING, habitId: id });
    }
    expect(historyDay(state, DURING)).toEqual({ outcome: 'checkIn', logs: 6, target: 4 });
  });

  it('a day that locks after the removal still counts the removed habits', () => {
    let state = withExtraWeek();
    state = trackerReducer(state, { type: 'logHabit', date: DURING, habitId: 'sleep' });
    state = lockDays(state, '2026-10-19');
    expect(state.locked[DURING]).toEqual({ outcome: 'none', logs: 1, target: 4 });
  });

  it('removing a habit the same day it was added leaves no trace', () => {
    let state = createInitialState();
    state = trackerReducer(state, { type: 'addHabit', id: 'read', name: 'Read', date: ADDED });
    state = trackerReducer(state, { type: 'removeHabit', habitId: 'read', date: ADDED });
    expect(state.removed).toEqual([]);
    expect(possible(state, ADDED)).toBe(3);
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
});

describe('saving removed habits (T21)', () => {
  it('loads a current save with removed habits as is', () => {
    const state = withExtraWeek();
    expect(loadSave(JSON.stringify(state))).toEqual({ kind: 'loaded', state, upgradedFrom: null });
  });

  it('a current save missing its removed list is kept as unreadable, never dropped', () => {
    const broken = { ...createInitialState() } as Record<string, unknown>;
    delete broken.removed;
    const raw = JSON.stringify(broken);
    expect(loadSave(raw)).toEqual({ kind: 'unreadable', raw });
  });
});
