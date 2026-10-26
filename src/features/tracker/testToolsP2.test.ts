// Prototype 2 Test tools (P2-05, #76): Fill today, the pet's Love and Confidence (P2-13), and the v7 to v8 upgrade
// that carries Prototype 1 tracking into Prototype 2. The safety rule under test: these tools
// only ever write the Test save. Real is never touched.

import { describe, expect, it } from '@jest/globals';
import { tuning } from '@/config/tuning';
import { petStats, type PetStat } from '@/rules/petStats';
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
const setStat = (stat: PetStat, value: number): AppAction => ({
  type: 'setTestStat',
  stat,
  value,
  realDate: REAL,
});
const confidence = (value: number) => setStat('confidence', value);
const testStats = (app: AppState) => petStats(app.test.state);

describe('Fill today (Test only)', () => {
  it('finishes every habit on the pretend day and writes only the Test save', () => {
    const start = inTest();
    const { app, keys } = run(start, { type: 'nextDay', realDate: REAL }, fill);
    const day = app.test.state.log['2026-10-20'] ?? {};
    expect(Object.keys(day).sort()).toEqual(app.test.state.habits.map((h) => h.id).sort());
    expect(Object.values(day).every((c) => c === 1)).toBe(true);
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

describe('Pet Love and Confidence steppers (Test only)', () => {
  it('sets the Test pet and leaves Real alone', () => {
    const start = inTest();
    const { app, keys } = run(start, confidence(70), setStat('love', 40));
    expect(testStats(app)).toEqual({ love: 40, confidence: 70 });
    expect(app.real).toBe(start.real);
    expect(keys).toEqual([TEST_KEY, TEST_KEY]);
  });

  it('stays between 0 and 100 and whole', () => {
    expect(testStats(run(inTest(), confidence(140)).app).confidence).toBe(100);
    expect(testStats(run(inTest(), confidence(-5)).app).confidence).toBe(0);
    expect(testStats(run(inTest(), setStat('love', 33.6)).app).love).toBe(34);
  });

  it('does nothing in Real', () => {
    const start = createAppState();
    expect(appReducer(start, confidence(90))).toBe(start);
  });

  it('a nudge stays on top of what the log earns', () => {
    const { app } = run(inTest(), confidence(50), fill);
    expect(testStats(app).confidence).toBeGreaterThan(50);
  });

  it('Reset test data puts both back to their start values', () => {
    const { app } = run(inTest(), confidence(90), setStat('love', 90), {
      type: 'resetTest',
      realDate: REAL,
    });
    expect(testStats(app)).toEqual({
      love: tuning.pet.stats.startLove,
      confidence: tuning.pet.stats.startConfidence,
    });
  });
});

describe('Heal quest tools (Test only, P2-15)', () => {
  const heal = (count: number): AppAction => ({
    type: 'setTestHealCheckIns',
    count,
    realDate: REAL,
  });

  it('the stepper changes the Test quest and leaves Real alone', () => {
    const start = inTest();
    const { app, keys } = run(start, heal(4));
    expect(app.test.state.quests.heal.testBonus).toBeGreaterThan(0);
    expect(app.real).toBe(start.real);
    expect(keys).toEqual([TEST_KEY]);
  });

  it('does nothing in Real', () => {
    const start = createAppState();
    expect(appReducer(start, heal(4))).toBe(start);
    expect(appReducer(start, { type: 'resetTestQuest', realDate: REAL })).toBe(start);
  });
});

describe('Prototype 1 saves carry into Prototype 2', () => {
  it('a v7 save gains the pet, and its stars become logs', () => {
    const { pet: _pet, targets: _targets, habits, ...rest } = createInitialState();
    const v7 = {
      ...rest,
      version: 7 as const,
      // Habits as v7 saved them: a weekly goal in place of the schedule.
      habits: habits.map(({ schedule, ...h }) => ({
        ...h,
        goal: schedule.kind === 'anyDays' ? { kind: 'anyDays', timesPerWeek: 3 } : schedule,
      })),
      log: { [REAL]: { sleep: 'NailedIt' } },
      lockedThrough: '2026-10-17',
    };
    const result = loadSave(JSON.stringify(v7));
    if (result.kind !== 'loaded') throw new Error(result.kind);
    expect(result.upgradedFrom).toBe(7);
    expect(result.state).toEqual({
      ...createInitialState(),
      pet: expect.objectContaining({ loveAdjust: expect.any(Number) }),
      log: { [REAL]: { sleep: 1 } },
      lockedThrough: '2026-10-17',
    });
    // The pet starts at its start values, whatever the old log earns.
    expect(petStats(result.state)).toEqual({
      love: tuning.pet.stats.startLove,
      confidence: tuning.pet.stats.startConfidence,
    });
  });
});

describe('Editing a habit schedule and times per day', () => {
  it('changes a habit to Any days in Real', () => {
    const app = appReducer(createAppState(), {
      type: 'tracker',
      action: { type: 'setSchedule', habitId: 'sleep', schedule: { kind: 'anyDays' } },
      realDate: REAL,
    });
    expect(app.real.state.habits.find((h) => h.id === 'sleep')?.schedule).toEqual({
      kind: 'anyDays',
    });
  });

  it('changes times per day in Real, as Test tools do', () => {
    const app = appReducer(createAppState(), {
      type: 'tracker',
      action: { type: 'setTimesPerDay', habitId: 'diet', times: 3 },
      realDate: REAL,
    });
    expect(app.real.state.habits.find((h) => h.id === 'diet')?.timesPerDay).toBe(3);
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
