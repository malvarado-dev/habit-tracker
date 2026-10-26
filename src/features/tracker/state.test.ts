import { describe, expect, it } from '@jest/globals';
import { tuning } from '@/config/tuning';
import { EVERY_DAY } from '@/rules/habits';
import { createInitialState, leastUsedColor, trackerReducer, type TrackerState } from './state';

const MON = '2026-10-12';

function apply(state: TrackerState, ...actions: Parameters<typeof trackerReducer>[1][]) {
  return actions.reduce(trackerReducer, state);
}

describe('trackerReducer', () => {
  it('starts with the four prototype habits and their schedules', () => {
    const state = createInitialState();
    expect(state.habits.map((h) => [h.name, h.schedule])).toEqual([
      ['Sleep', { kind: 'specificDays', days: EVERY_DAY }],
      ['Diet', { kind: 'specificDays', days: EVERY_DAY }],
      ['Exercise', { kind: 'anyDays' }],
      ['Wellbeing', { kind: 'specificDays', days: EVERY_DAY }],
    ]);
  });

  it('a tap logs one time', () => {
    const state = apply(createInitialState(), { type: 'logHabit', date: MON, habitId: 'sleep' });
    expect(state.log[MON]?.sleep).toBe(1);
  });

  it('a finished habit takes no more logs', () => {
    const log = { type: 'logHabit', date: MON, habitId: 'sleep' } as const;
    const state = apply(createInitialState(), log, log, log);
    expect(state.log[MON]?.sleep).toBe(1);
  });

  it('a frequency habit logs up to its times per day', () => {
    const log = { type: 'logHabit', date: MON, habitId: 'diet' } as const;
    const state = apply(
      createInitialState(),
      { type: 'setTimesPerDay', habitId: 'diet', times: 3 },
      log,
      log,
      log,
      log,
    );
    expect(state.log[MON]?.diet).toBe(3);
  });

  it('times per day stays between 1 and the max in tuning.ts', () => {
    const set = (times: number) =>
      apply(createInitialState(), { type: 'setTimesPerDay', habitId: 'diet', times }).habits[1]
        ?.timesPerDay;
    expect(set(0)).toBeUndefined(); // already 1, so nothing changes
    expect(set(99)).toBe(tuning.activityBar.timesPerDayMax);
    expect(set(4)).toBe(4);
  });

  it('Undo takes the last log back, never below zero', () => {
    const log = { type: 'logHabit', date: MON, habitId: 'sleep' } as const;
    const undo = { type: 'undoLog', date: MON, habitId: 'sleep' } as const;
    const once = apply(createInitialState(), log, undo);
    expect(once.log[MON]).toEqual({});
    expect(apply(once, undo)).toBe(once);
  });

  it("the first log of a day saves that day's Activity Bar target", () => {
    const state = apply(createInitialState(), { type: 'logHabit', date: MON, habitId: 'sleep' });
    // Sleep, Diet, Wellbeing due (3 possible), so 2 fill the bar. Exercise is Any days.
    expect(state.targets[MON]).toBe(2);
  });

  it('adding or removing a habit later that day never moves the target', () => {
    const opened = apply(createInitialState(), { type: 'lockDays', today: MON });
    expect(opened.targets[MON]).toBe(2);
    const changed = apply(
      opened,
      { type: 'addHabit', date: MON, id: 'read', name: 'Read' },
      { type: 'addHabit', date: MON, id: 'walk', name: 'Walk' },
      { type: 'removeHabit', date: MON, habitId: 'diet' },
    );
    expect(changed.targets[MON]).toBe(2);
  });

  it('adds a trimmed habit and ignores a blank one', () => {
    const added = apply(createInitialState(), {
      type: 'addHabit',
      date: '2026-10-19',
      id: 'read',
      name: '  Reading ',
    });
    expect(added.habits.at(-1)).toEqual({
      id: 'read',
      name: 'Reading',
      schedule: { kind: 'specificDays', days: EVERY_DAY },
      color: 'habit2',
      addedOn: '2026-10-19',
    });
    const blank = apply(createInitialState(), {
      type: 'addHabit',
      date: '2026-10-19',
      id: 'x',
      name: '   ',
    });
    expect(blank.habits).toHaveLength(4);
  });

  it('Specific days needs at least one day, and stores days in order without repeats', () => {
    const none = apply(createInitialState(), {
      type: 'setSchedule',
      habitId: 'sleep',
      schedule: { kind: 'specificDays', days: [] },
    });
    expect(none.habits[0]?.schedule).toEqual({ kind: 'specificDays', days: EVERY_DAY });
    const messy = apply(createInitialState(), {
      type: 'setSchedule',
      habitId: 'sleep',
      schedule: { kind: 'specificDays', days: [4, 0, 4, 2] },
    });
    expect(messy.habits[0]?.schedule).toEqual({ kind: 'specificDays', days: [0, 2, 4] });
  });

  it('switching a habit between Specific days and Any days works any time', () => {
    const state = apply(createInitialState(), {
      type: 'setSchedule',
      habitId: 'sleep',
      schedule: { kind: 'anyDays' },
    });
    expect(state.habits[0]?.schedule).toEqual({ kind: 'anyDays' });
  });

  it('never removes the last habit', () => {
    let state = createInitialState();
    for (const habit of state.habits) {
      state = trackerReducer(state, { type: 'removeHabit', habitId: habit.id, date: '2026-10-19' });
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
      state = trackerReducer(state, {
        type: 'addHabit',
        date: '2026-10-19',
        id: `h${i}`,
        name: `Habit ${i}`,
      });
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
    trackerReducer(createInitialState(), { type: 'logHabit', date: day, habitId: 'diet' });

  it('the last habit cannot be removed', () => {
    let state = createInitialState();
    for (const id of ['sleep', 'diet', 'exercise']) {
      state = trackerReducer(state, { type: 'removeHabit', habitId: id, date: '2026-10-19' });
    }
    expect(state.habits.map((h) => h.id)).toEqual(['wellbeing']);
    state = trackerReducer(state, {
      type: 'removeHabit',
      habitId: 'wellbeing',
      date: '2026-10-19',
    });
    expect(state.habits.map((h) => h.id)).toEqual(['wellbeing']);
  });

  it('Undo restores a removed habit with its history, in the same spot', () => {
    const before = scored();
    const habit = before.habits[1]!;
    const removed = trackerReducer(before, {
      type: 'removeHabit',
      habitId: 'diet',
      date: '2026-10-19',
    });
    const restored = trackerReducer(removed, { type: 'restoreHabit', habit, index: 1 });
    expect(restored.habits).toEqual(before.habits);
    expect(restored.log[day]?.diet).toBe(1);
  });

  it('Undo twice does not add the habit twice', () => {
    const before = scored();
    const habit = before.habits[1]!;
    const once = trackerReducer(
      trackerReducer(before, { type: 'removeHabit', habitId: 'diet', date: '2026-10-19' }),
      {
        type: 'restoreHabit',
        habit,
        index: 1,
      },
    );
    expect(trackerReducer(once, { type: 'restoreHabit', habit, index: 1 }).habits).toHaveLength(4);
  });

  it("switching Specific days and Any days keeps today's logs", () => {
    const before = scored();
    const toAny = trackerReducer(before, {
      type: 'setSchedule',
      habitId: 'diet',
      schedule: { kind: 'anyDays' },
    });
    const back = trackerReducer(toAny, {
      type: 'setSchedule',
      habitId: 'diet',
      schedule: { kind: 'specificDays', days: [0, 1, 2, 3, 4, 5, 6] },
    });
    expect(toAny.log).toEqual(before.log);
    expect(back.log).toEqual(before.log);
  });
});

describe('acceptance: Add habit (T13)', () => {
  it('a new habit gets the least-used habit color and its picked schedule', () => {
    const schedule = { kind: 'anyDays' } as const;
    const s = trackerReducer(createInitialState(), {
      type: 'addHabit',
      date: '2026-10-19',
      id: 'running',
      name: 'Running',
      schedule,
    });
    expect(s.habits.at(-1)).toMatchObject({ name: 'Running', color: 'habit2', schedule });
  });

  it('blank and duplicate names are never added', () => {
    let s = createInitialState();
    s = trackerReducer(s, { type: 'addHabit', date: '2026-10-19', id: 'a', name: '  ' });
    s = trackerReducer(s, { type: 'addHabit', date: '2026-10-19', id: 'b', name: ' sleep ' });
    expect(s.habits).toHaveLength(4);
  });

  it('15 habits is the most', () => {
    let s = createInitialState();
    for (let i = 0; i < 20; i++)
      s = trackerReducer(s, { type: 'addHabit', date: '2026-10-19', id: `h${i}`, name: `H${i}` });
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
