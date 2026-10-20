// Real and Test (SPEC-00, T17). Two separate trackers, each saved under its own key and never
// copied into the other. The Real / Test switch only picks which one the screens see, so a
// switch can never write real data into Test or the other way round. Real always lives on the
// real date; only Test has a pretend date (Next day). Plain TypeScript, no screens, so every
// safety rule is unit tested. Prototype only: removed with the Test tools after Stage 3.

import { calendar } from '@/config/calendar';
import { addDays, toDateKey, type DateKey } from '@/rules/dates';
import { backupKey, loadSave } from './save';
import { createInitialState, trackerReducer, type TrackerAction, type TrackerState } from './state';

export const REAL_KEY = 'habit-tracker/prototype';
export const TEST_KEY = 'habit-tracker/prototype-test';
export const TEST_OFFSET_KEY = 'habit-tracker/prototype-test-day-offset';
export const MODE_KEY = 'habit-tracker/prototype-mode';

export type Mode = 'real' | 'test';

/** One tracker and whether it may be saved (false when the device holds a newer app's save). */
export interface Slot {
  state: TrackerState;
  canSave: boolean;
}

export interface AppState {
  mode: Mode;
  real: Slot;
  test: Slot;
  /** Test only: days ahead of the real date. Real has no pretend date at all. */
  testOffset: number;
}

/** The date a mode lives on. Real is always the real date. */
export function modeToday(app: AppState, realDate: DateKey, mode: Mode = app.mode): DateKey {
  return mode === 'test' ? addDays(realDate, app.testOffset) : realDate;
}

/** How many days before today can be changed: 2 in Real, 45 in Test (T22). */
export function openDaysFor(mode: Mode): number {
  return mode === 'test' ? calendar.testOpenDaysBeforeToday : calendar.openDaysBeforeToday;
}

/** The oldest day that can be opened. Test stops at its open window; Real shows every past day. */
export function oldestOpenableDay(mode: Mode, today: DateKey): DateKey | null {
  return mode === 'test' ? addDays(today, -openDaysFor(mode)) : null;
}

export type AppAction =
  /** A change from the screens, applied only to the active tracker. */
  | { type: 'tracker'; action: TrackerAction; realDate: DateKey }
  /** Lock both trackers, each on its own date (app open, midnight, before every change). */
  | { type: 'lock'; realDate: DateKey }
  | { type: 'setMode'; mode: Mode }
  /** Test only. Ignored in Real. */
  | { type: 'nextDay'; realDate: DateKey }
  | { type: 'backToToday' }
  | { type: 'resetTest'; realDate: DateKey };

function lockSlot(slot: Slot, today: DateKey, mode: Mode): Slot {
  const state = trackerReducer(slot.state, {
    type: 'lockDays',
    today,
    openDays: openDaysFor(mode),
  });
  return state === slot.state ? slot : { ...slot, state };
}

/**
 * Every change returns a new object only for what changed. The provider saves a tracker only when
 * its object changes, so an untouched Real slot is never written.
 */
export function appReducer(app: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'tracker': {
      const key = app.mode;
      const today = modeToday(app, action.realDate);
      // Lock first, so a day can't be edited after it locks.
      const locked = lockSlot(app[key], today, key);
      const state = trackerReducer(locked.state, action.action);
      if (locked === app[key] && state === locked.state) return app;
      return { ...app, [key]: { ...locked, state } };
    }
    case 'lock': {
      const real = lockSlot(app.real, action.realDate, 'real');
      const test = lockSlot(app.test, modeToday(app, action.realDate, 'test'), 'test');
      if (real === app.real && test === app.test) return app;
      return { ...app, real, test };
    }
    case 'setMode':
      return app.mode === action.mode ? app : { ...app, mode: action.mode };
    case 'nextDay': {
      if (app.mode !== 'test') return app;
      // The pretend day moves on, so Test locks the day that just fell out of its window.
      const moved = { ...app, testOffset: app.testOffset + 1 };
      return {
        ...moved,
        test: lockSlot(moved.test, modeToday(moved, action.realDate, 'test'), 'test'),
      };
    }
    case 'backToToday':
      // Check-ins stay; only the pretend date goes back. Days locked ahead stay locked.
      return app.mode === 'test' && app.testOffset !== 0 ? { ...app, testOffset: 0 } : app;
    case 'resetTest':
      // Erases only the test save. Real is never touched.
      if (app.mode !== 'test') return app;
      // Test starter habits have no added date, so they exist on every day the pretend date reaches.
      return {
        ...app,
        test: { ...app.test, state: createInitialState() },
        testOffset: 0,
      };
  }
}

/** Fresh app: Real is the default; Test starts with the four starter habits. */
export function createAppState(): AppState {
  return {
    mode: 'real',
    real: { state: createInitialState(), canSave: true },
    test: { state: createInitialState(), canSave: true },
    testOffset: 0,
  };
}

/** The device storage the provider uses (AsyncStorage), or a fake one in tests. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/**
 * Loads one tracker from its own key through the upgrade path (T16). An unreadable save is
 * copied to a backup key first; if that copy fails, saving stays off so nothing is lost.
 */
export async function loadSlot(store: KeyValueStore, key: string, now: Date): Promise<Slot> {
  // A fresh Real start adds the starter habits today, so their first week is scaled (#52).
  // A fresh Test start leaves them undated, so past pretend days still show them.
  const addedOn = key === TEST_KEY ? undefined : toDateKey(now);
  const fresh = { state: createInitialState(addedOn), canSave: true };
  let raw: string | null;
  try {
    raw = await store.getItem(key);
  } catch {
    return { ...fresh, canSave: false };
  }
  const result = loadSave(raw);
  if (result.kind === 'loaded') return { state: result.state, canSave: true };
  if (result.kind === 'newer') return { ...fresh, canSave: false };
  if (result.kind === 'unreadable') {
    try {
      await store.setItem(backupKey(key, now), result.raw);
    } catch {
      return { ...fresh, canSave: false };
    }
  }
  return fresh;
}

export async function loadAppState(store: KeyValueStore, now: Date): Promise<AppState> {
  const [real, test, offsetRaw, modeRaw] = await Promise.all([
    loadSlot(store, REAL_KEY, now),
    loadSlot(store, TEST_KEY, now),
    store.getItem(TEST_OFFSET_KEY).catch(() => null),
    store.getItem(MODE_KEY).catch(() => null),
  ]);
  const offset = Number(offsetRaw);
  return {
    mode: modeRaw === 'test' ? 'test' : 'real',
    real,
    test,
    testOffset: Number.isInteger(offset) && offset > 0 ? offset : 0,
  };
}

/**
 * What to write after a change: only the pieces whose objects changed, each to its own key.
 * Real is written only when the Real tracker itself changed.
 */
export function savesFor(before: AppState, after: AppState): [string, string][] {
  const writes: [string, string][] = [];
  if (after.real !== before.real && after.real.canSave) {
    writes.push([REAL_KEY, JSON.stringify(after.real.state)]);
  }
  if (after.test !== before.test && after.test.canSave) {
    writes.push([TEST_KEY, JSON.stringify(after.test.state)]);
  }
  if (after.testOffset !== before.testOffset) {
    writes.push([TEST_OFFSET_KEY, String(after.testOffset)]);
  }
  if (after.mode !== before.mode) writes.push([MODE_KEY, after.mode]);
  return writes;
}
