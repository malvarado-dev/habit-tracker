// Prototype 2 Test tools (P2-05, #76): Fill today, the pet's Confidence, and the v7 to v8 upgrade
// that carries Prototype 1 tracking into Prototype 2. The safety rule under test: these tools
// only ever write the Test save. Real is never touched.

import { describe, expect, it } from '@jest/globals';
import { tuning } from '@/config/tuning';
import {
  BAD_HABIT_DESIGN_STORAGE_KEY,
  loadBadHabitDesign,
  saveBadHabitDesign,
} from '@/features/settings/settings';
import {
  appReducer,
  createAppState,
  REAL_KEY,
  savesFor,
  TEST_KEY,
  type AppAction,
  type AppState,
} from './modes';
import { loadSave } from './save';
import { createInitialState } from './state';

const REAL = '2026-10-19';

function run(start: AppState, ...actions: AppAction[]) {
  let app = start;
  const keys: string[] = [];
  for (const action of actions) {
    const next = appReducer(app, action);
    keys.push(...savesFor(app, next).map(([k]) => k));
    app = next;
  }
  return { app, keys };
}

const inTest = (): AppState => ({ ...createAppState(), mode: 'test' });
const fill: AppAction = { type: 'fillTestDay', realDate: REAL };
const confidence = (value: number): AppAction => ({
  type: 'setTestConfidence',
  value,
  realDate: REAL,
});

describe('Fill today (Test only)', () => {
  it('checks in every habit on the pretend day and writes only the Test save', () => {
    const start = inTest();
    const { app, keys } = run(start, { type: 'nextDay', realDate: REAL }, fill);
    const day = app.test.state.log['2026-10-20'] ?? {};
    expect(Object.keys(day).sort()).toEqual(app.test.state.habits.map((h) => h.id).sort());
    expect(Object.values(day).every((c) => c === 'NailedIt')).toBe(true);
    expect(app.real).toBe(start.real);
    expect(keys).not.toContain(REAL_KEY);
    expect(keys).toContain(TEST_KEY);
  });

  it('does nothing in Real', () => {
    const start = createAppState();
    const { app, keys } = run(start, fill);
    expect(app).toBe(start);
    expect(keys).toEqual([]);
  });

  it('a second tap changes nothing', () => {
    const once = run(inTest(), fill).app;
    expect(appReducer(once, fill)).toBe(once);
  });

  it('never changes a locked day', () => {
    const state = { ...createInitialState(), lockedThrough: '2026-10-30' };
    const start: AppState = { ...inTest(), test: { state, canSave: true } };
    expect(appReducer(start, fill)).toBe(start);
  });
});

describe('Pet confidence (Test only)', () => {
  it('sets the Test pet and leaves Real alone', () => {
    const start = inTest();
    const { app, keys } = run(start, confidence(70));
    expect(app.test.state.pet.confidence).toBe(70);
    expect(app.real).toBe(start.real);
    expect(keys).toEqual([TEST_KEY]);
  });

  it('stays between 0 and 100 and whole', () => {
    expect(run(inTest(), confidence(140)).app.test.state.pet.confidence).toBe(100);
    expect(run(inTest(), confidence(-5)).app.test.state.pet.confidence).toBe(0);
    expect(run(inTest(), confidence(33.6)).app.test.state.pet.confidence).toBe(34);
  });

  it('does nothing in Real', () => {
    const start = createAppState();
    expect(appReducer(start, confidence(90))).toBe(start);
  });

  it('Reset test data puts it back to the start value', () => {
    const { app } = run(inTest(), confidence(90), { type: 'resetTest', realDate: REAL });
    expect(app.test.state.pet.confidence).toBe(tuning.pet.startConfidence);
  });
});

describe('Prototype 1 saves carry into Prototype 2 (v7 to v8)', () => {
  it('keeps habits, check-ins and locked days exactly, and adds the pet', () => {
    const { pet: _pet, ...v7 } = {
      ...createInitialState(),
      version: 7 as const,
      log: { [REAL]: { sleep: 'NailedIt' as const } },
      lockedThrough: '2026-10-17',
    };
    const result = loadSave(JSON.stringify(v7));
    if (result.kind !== 'loaded') throw new Error(result.kind);
    expect(result.upgradedFrom).toBe(7);
    expect(result.state).toEqual({
      ...v7,
      version: 8,
      pet: { confidence: tuning.pet.startConfidence },
    });
  });
});

describe('Editing a habit frequency still works on a Prototype 2 save', () => {
  it('changes a habit to 4 times a week in Real', () => {
    const start = createAppState();
    const app = appReducer(start, {
      type: 'tracker',
      action: { type: 'setGoal', habitId: 'exercise', goal: { kind: 'anyDays', timesPerWeek: 4 } },
      realDate: REAL,
    });
    expect(app.real.state.habits.find((h) => h.id === 'exercise')?.goal).toEqual({
      kind: 'anyDays',
      timesPerWeek: 4,
    });
  });

  it('changes a habit to specific days', () => {
    const app = appReducer(createAppState(), {
      type: 'tracker',
      action: {
        type: 'setGoal',
        habitId: 'sleep',
        goal: { kind: 'specificDays', days: [0, 2, 4] },
      },
      realDate: REAL,
    });
    expect(app.real.state.habits.find((h) => h.id === 'sleep')?.goal).toEqual({
      kind: 'specificDays',
      days: [0, 2, 4],
    });
  });
});

describe('Bad habits Design switch (setting, not data)', () => {
  const storage = (initial: Record<string, string> = {}) => {
    const data = { ...initial };
    return {
      data,
      getItem: async (k: string) => data[k] ?? null,
      setItem: async (k: string, v: string) => {
        data[k] = v;
      },
    };
  };

  it('defaults to Design 1', async () => {
    expect(await loadBadHabitDesign(storage())).toBe('design1');
  });

  it('saves under its own key, never in a tracker save', async () => {
    const s = storage();
    await saveBadHabitDesign(s, 'design2');
    expect(s.data).toEqual({ [BAD_HABIT_DESIGN_STORAGE_KEY]: 'design2' });
    expect(await loadBadHabitDesign(s)).toBe('design2');
  });

  it('an unknown saved value falls back to Design 1', async () => {
    expect(await loadBadHabitDesign(storage({ [BAD_HABIT_DESIGN_STORAGE_KEY]: 'x' }))).toBe(
      'design1',
    );
  });
});
