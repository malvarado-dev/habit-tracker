import { describe, expect, it } from '@jest/globals';
import {
  appReducer,
  createAppState,
  loadAppState,
  MODE_KEY,
  modeToday,
  REAL_KEY,
  savesFor,
  TEST_KEY,
  TEST_OFFSET_KEY,
  type AppAction,
  type AppState,
  type KeyValueStore,
} from './modes';
import { createInitialState } from './state';

// Pretend dates. Monday 2026-10-19 is the real date.
const REAL = '2026-10-19';

const tap = (habitId: string, date = REAL): AppAction => ({
  type: 'tracker',
  action: { type: 'tapHabit', date, habitId },
  realDate: REAL,
});

/** Runs actions and collects every write the provider would make. */
function run(start: AppState, ...actions: AppAction[]) {
  let app = start;
  const writes: [string, string][] = [];
  for (const action of actions) {
    const next = appReducer(app, action);
    writes.push(...savesFor(app, next));
    app = next;
  }
  return { app, writes, keys: writes.map(([k]) => k) };
}

function fakeStore(initial: Record<string, string> = {}): KeyValueStore & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: async (k) => data[k] ?? null,
    setItem: async (k, v) => {
      data[k] = v;
    },
  };
}

describe('Real and Test never cross', () => {
  it('switching to Test and back never writes the real save', () => {
    const { keys } = run(
      createAppState(),
      { type: 'setMode', mode: 'test' },
      tap('sleep'),
      { type: 'nextDay', realDate: REAL },
      { type: 'setMode', mode: 'real' },
    );
    expect(keys).not.toContain(REAL_KEY);
    expect(keys).toContain(TEST_KEY);
  });

  it('real data comes back exactly, check-in by check-in', () => {
    const real = run(createAppState(), tap('sleep'), tap('diet'), tap('diet')).app;
    const before = real.real;
    const after = run(
      real,
      { type: 'setMode', mode: 'test' },
      tap('sleep'),
      tap('wellbeing'),
      { type: 'resetTest' },
      { type: 'setMode', mode: 'real' },
    ).app;
    expect(after.real).toBe(before);
    expect(after.real.state.log[REAL]).toEqual({ sleep: 'Started', diet: 'OnTrack' });
  });

  it('Reset in Test erases only the test save', () => {
    const start = run(
      createAppState(),
      tap('sleep'),
      { type: 'setMode', mode: 'test' },
      tap('diet'),
    );
    const { app, keys } = run(start.app, { type: 'resetTest' });
    expect(keys).toEqual([TEST_KEY]);
    expect(app.test.state).toEqual(createInitialState());
    expect(app.real.state.log[REAL]).toEqual({ sleep: 'Started' });
  });

  it('Next day, Back to today, and Reset do nothing in Real', () => {
    const real = run(createAppState(), tap('sleep')).app;
    const { app, writes } = run(
      real,
      { type: 'nextDay', realDate: REAL },
      { type: 'backToToday' },
      { type: 'resetTest' },
    );
    expect(app).toBe(real);
    expect(writes).toEqual([]);
    expect(modeToday(app, REAL)).toBe(REAL);
  });

  it('a save from a newer app is never written, in either mode', () => {
    const start = createAppState();
    const blocked = { ...start, real: { ...start.real, canSave: false } };
    expect(run(blocked, tap('sleep')).keys).not.toContain(REAL_KEY);
  });
});

describe('the pretend date lives only in Test', () => {
  it('Next day moves Test, and taps land on the pretend date', () => {
    const { app, keys } = run(
      createAppState(),
      { type: 'setMode', mode: 'test' },
      { type: 'nextDay', realDate: REAL },
      tap('sleep', '2026-10-20'),
    );
    expect(modeToday(app, REAL)).toBe('2026-10-20');
    expect(modeToday(app, REAL, 'real')).toBe(REAL);
    expect(keys).toContain(TEST_OFFSET_KEY);
    expect(app.test.state.log['2026-10-20']).toEqual({ sleep: 'Started' });
  });

  it('Test locks days by its pretend date, Real by the real date', () => {
    const withData = run(
      createAppState(),
      tap('sleep', '2026-10-16'),
      { type: 'setMode', mode: 'test' },
      tap('sleep', '2026-10-19'),
      { type: 'nextDay', realDate: REAL },
      { type: 'nextDay', realDate: REAL },
      { type: 'nextDay', realDate: REAL },
    ).app;
    // Real: the 16th is 3 days back, so it's locked; the 17th is still open.
    expect(withData.real.state.lockedThrough).toBe('2026-10-16');
    // Test is 3 days ahead (the 22nd), so its 19th is now locked.
    expect(withData.test.state.lockedThrough).toBe('2026-10-19');
    expect(withData.test.state.locked['2026-10-19']).toBeDefined();
  });
});

describe('loading', () => {
  it('starts in Real, with Test fresh, when nothing is saved', async () => {
    const app = await loadAppState(fakeStore(), new Date());
    expect(app.mode).toBe('real');
    expect(app.test.state).toEqual(createInitialState());
    expect(app.testOffset).toBe(0);
  });

  it('upgrades a v4 real save to v5 keeping all real data, and drops its pretend date', async () => {
    const v4 = {
      version: 4,
      habits: createInitialState().habits,
      log: { [REAL]: { sleep: 'NailedIt' } },
      dayOffset: 3,
      locked: { '2026-10-10': { outcome: 'rank', rank: 'S', earnedStars: 9, possibleStars: 9 } },
      lockedThrough: '2026-10-16',
    };
    const store = fakeStore({ [REAL_KEY]: JSON.stringify(v4) });
    const app = await loadAppState(store, new Date());
    expect(app.real.state).toEqual({
      version: 5,
      habits: v4.habits,
      log: v4.log,
      locked: v4.locked,
      lockedThrough: v4.lockedThrough,
    });
    expect('dayOffset' in app.real.state).toBe(false);
    expect(modeToday(app, REAL)).toBe(REAL);
  });

  it('remembers Test mode and its pretend date', async () => {
    const store = fakeStore({ [MODE_KEY]: 'test', [TEST_OFFSET_KEY]: '2' });
    const app = await loadAppState(store, new Date());
    expect(app.mode).toBe('test');
    expect(modeToday(app, REAL)).toBe('2026-10-21');
  });

  it('an unreadable real save goes to a backup and saving it stays possible', async () => {
    const store = fakeStore({ [REAL_KEY]: '{oops' });
    const app = await loadAppState(store, new Date('2026-10-19T12:00:00Z'));
    expect(Object.keys(store.data).some((k) => k.startsWith(`${REAL_KEY}/backup/`))).toBe(true);
    expect(app.real.canSave).toBe(true);
  });
});
