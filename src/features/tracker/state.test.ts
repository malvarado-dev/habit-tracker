import { describe, expect, it } from '@jest/globals';
import { EVERY_DAY } from '@/rules/scoring';
import { createInitialState, leastUsedColor, trackerReducer, type TrackerState } from './state';

const MON = '2026-10-12';

function apply(state: TrackerState, ...actions: Parameters<typeof trackerReducer>[1][]) {
  return actions.reduce(trackerReducer, state);
}

describe('trackerReducer', () => {
  it('starts with the four prototype habits and their weekly goals', () => {
    const state = createInitialState();
    expect(state.habits.map((h) => [h.name, h.goal])).toEqual([
      ['Sleep', { kind: 'specificDays', days: EVERY_DAY }],
      ['Diet', { kind: 'specificDays', days: EVERY_DAY }],
      ['Exercise', { kind: 'anyDays', timesPerWeek: 3 }],
      ['Wellbeing', { kind: 'specificDays', days: EVERY_DAY }],
    ]);
  });

  it('the first tap checks in Started', () => {
    const state = apply(createInitialState(), { type: 'tapHabit', date: MON, habitId: 'sleep' });
    expect(state.log[MON]?.sleep).toBe('Started');
  });

  it('five taps go all the way around, back to To do', () => {
    const tap = { type: 'tapHabit', date: MON, habitId: 'sleep' } as const;
    const four = apply(createInitialState(), tap, tap, tap, tap);
    expect(four.log[MON]?.sleep).toBe('NotToday');
    const five = apply(four, tap);
    expect(five.log[MON]).toEqual({});
  });

  it('swipes set a check-in directly', () => {
    const state = apply(createInitialState(), {
      type: 'setCheckIn',
      date: MON,
      habitId: 'diet',
      checkIn: 'NailedIt',
    });
    expect(state.log[MON]?.diet).toBe('NailedIt');
  });

  it('adds a trimmed habit and ignores a blank one', () => {
    const added = apply(createInitialState(), { type: 'addHabit', id: 'read', name: '  Reading ' });
    expect(added.habits.at(-1)).toEqual({
      id: 'read',
      name: 'Reading',
      goal: { kind: 'specificDays', days: EVERY_DAY },
      color: 'habit2',
    });
    const blank = apply(createInitialState(), { type: 'addHabit', id: 'x', name: '   ' });
    expect(blank.habits).toHaveLength(4);
  });

  it('keeps Any days goals between 1 and 7 times a week', () => {
    const set = (timesPerWeek: number) =>
      apply(createInitialState(), {
        type: 'setGoal',
        habitId: 'exercise',
        goal: { kind: 'anyDays', timesPerWeek },
      }).habits[2]?.goal;
    expect(set(0)).toEqual({ kind: 'anyDays', timesPerWeek: 1 });
    expect(set(9)).toEqual({ kind: 'anyDays', timesPerWeek: 7 });
  });

  it('Specific days needs at least one day, and stores days in order without repeats', () => {
    const none = apply(createInitialState(), {
      type: 'setGoal',
      habitId: 'sleep',
      goal: { kind: 'specificDays', days: [] },
    });
    expect(none.habits[0]?.goal).toEqual({ kind: 'specificDays', days: EVERY_DAY });
    const messy = apply(createInitialState(), {
      type: 'setGoal',
      habitId: 'sleep',
      goal: { kind: 'specificDays', days: [4, 0, 4, 2] },
    });
    expect(messy.habits[0]?.goal).toEqual({ kind: 'specificDays', days: [0, 2, 4] });
  });

  it('switching a habit between Specific days and Any days works any time', () => {
    const state = apply(createInitialState(), {
      type: 'setGoal',
      habitId: 'sleep',
      goal: { kind: 'anyDays', timesPerWeek: 4 },
    });
    expect(state.habits[0]?.goal).toEqual({ kind: 'anyDays', timesPerWeek: 4 });
  });

  it('never removes the last habit', () => {
    let state = createInitialState();
    for (const habit of state.habits) {
      state = trackerReducer(state, { type: 'removeHabit', habitId: habit.id });
    }
    expect(state.habits).toHaveLength(1);
  });
});

describe('habit colors', () => {
  it('the four starter habits each get their own color', () => {
    const colors = createInitialState().habits.map((h) => h.color);
    expect(new Set(colors).size).toBe(4);
  });

  it('a new habit gets the least-used color, earliest in the palette on a tie', () => {
    const starters = createInitialState().habits; // uses habit1, habit3, habit5, habit6
    expect(leastUsedColor(starters)).toBe('habit2');
    expect(leastUsedColor([])).toBe('habit1');
  });

  it('once every color is used, it starts reusing the least-used one', () => {
    let state = createInitialState();
    for (let i = 0; i < 5; i++) {
      state = trackerReducer(state, { type: 'addHabit', id: `h${i}`, name: `Habit ${i}` });
    }
    expect(state.habits.map((h) => h.color).slice(4)).toEqual([
      'habit2',
      'habit4',
      'habit7',
      'habit8',
      'habit1',
    ]);
  });
});

describe('acceptance: Habits and Edit habit (T12)', () => {
  const day = '2026-10-19';
  const scored = () =>
    trackerReducer(createInitialState(), { type: 'tapHabit', date: day, habitId: 'diet' });

  it('the last habit cannot be removed', () => {
    let state = createInitialState();
    for (const id of ['sleep', 'diet', 'exercise']) {
      state = trackerReducer(state, { type: 'removeHabit', habitId: id });
    }
    expect(state.habits.map((h) => h.id)).toEqual(['wellbeing']);
    state = trackerReducer(state, { type: 'removeHabit', habitId: 'wellbeing' });
    expect(state.habits.map((h) => h.id)).toEqual(['wellbeing']);
  });

  it('Undo restores a removed habit with its history, in the same spot', () => {
    const before = scored();
    const habit = before.habits[1]!;
    const removed = trackerReducer(before, { type: 'removeHabit', habitId: 'diet' });
    const restored = trackerReducer(removed, { type: 'restoreHabit', habit, index: 1 });
    expect(restored.habits).toEqual(before.habits);
    expect(restored.log[day]?.diet).toBe('Started');
  });

  it('Undo twice does not add the habit twice', () => {
    const before = scored();
    const habit = before.habits[1]!;
    const once = trackerReducer(trackerReducer(before, { type: 'removeHabit', habitId: 'diet' }), {
      type: 'restoreHabit',
      habit,
      index: 1,
    });
    expect(trackerReducer(once, { type: 'restoreHabit', habit, index: 1 }).habits).toHaveLength(4);
  });

  it("switching Specific days and Any days keeps today's scores", () => {
    const before = scored();
    const toAny = trackerReducer(before, {
      type: 'setGoal',
      habitId: 'diet',
      goal: { kind: 'anyDays', timesPerWeek: 7 },
    });
    const back = trackerReducer(toAny, {
      type: 'setGoal',
      habitId: 'diet',
      goal: { kind: 'specificDays', days: [0, 1, 2, 3, 4, 5, 6] },
    });
    expect(toAny.log).toEqual(before.log);
    expect(back.log).toEqual(before.log);
  });
});

describe('acceptance: Add habit (T13)', () => {
  it('a new habit gets the least-used habit color and its picked goal', () => {
    const goal = { kind: 'anyDays', timesPerWeek: 3 } as const;
    const s = trackerReducer(createInitialState(), {
      type: 'addHabit',
      id: 'running',
      name: 'Running',
      goal,
    });
    expect(s.habits.at(-1)).toMatchObject({ name: 'Running', color: 'habit2', goal });
  });

  it('blank and duplicate names are never added', () => {
    let s = createInitialState();
    s = trackerReducer(s, { type: 'addHabit', id: 'a', name: '  ' });
    s = trackerReducer(s, { type: 'addHabit', id: 'b', name: ' sleep ' });
    expect(s.habits).toHaveLength(4);
  });

  it('15 habits is the most', () => {
    let s = createInitialState();
    for (let i = 0; i < 20; i++)
      s = trackerReducer(s, { type: 'addHabit', id: `h${i}`, name: `H${i}` });
    expect(s.habits).toHaveLength(15);
  });

  it('a rename to a blank or duplicate name keeps the last valid name', () => {
    let s = createInitialState();
    s = trackerReducer(s, { type: 'renameHabit', habitId: 'diet', name: '' });
    s = trackerReducer(s, { type: 'renameHabit', habitId: 'diet', name: 'SLEEP' });
    expect(s.habits[1]!.name).toBe('Diet');
    s = trackerReducer(s, { type: 'renameHabit', habitId: 'diet', name: '  Meal  prep ' });
    expect(s.habits[1]!.name).toBe('Meal prep');
  });
});
