// P2-10: the Design 1 / Design 2 switch changes how habits read, never the saved data.
import { describe, expect, it } from '@jest/globals';
import { isMirrorBadHabit } from '@/features/habits/premadeHabits';
import { designView } from './designView';
import { appReducer, createAppState, savesFor } from './modes';
import { createInitialState, trackerReducer, type TrackerState } from './state';

const DAY = '2026-10-25';

function withWater(): TrackerState {
  const s = createInitialState();
  return {
    ...s,
    habits: s.habits.map((h) => (h.id === 'diet' ? { ...h, name: 'Water', timesPerDay: 8 } : h)),
    badHabits: [
      { id: 'bad-poor-sleep-1', name: 'Poor Sleep', pairedWith: 'sleep' },
      { id: 'bad-soda-2', name: 'Soda' },
    ],
  };
}

describe('Design 2 logging', () => {
  it('one tap finishes a frequency habit, and a second tap does nothing', () => {
    const once = trackerReducer(
      withWater(),
      { type: 'logHabit', date: DAY, habitId: 'diet' },
      'design2',
    );
    expect(once.log[DAY]?.diet).toBe(1);
    const twice = trackerReducer(once, { type: 'logHabit', date: DAY, habitId: 'diet' }, 'design2');
    expect(twice).toBe(once);
  });

  it('keeps the saved frequency, so Design 1 shows the same logs as 1/8 again', () => {
    const s = trackerReducer(
      withWater(),
      { type: 'logHabit', date: DAY, habitId: 'diet' },
      'design2',
    );
    expect(s.habits.find((h) => h.id === 'diet')?.timesPerDay).toBe(8);
    const more = trackerReducer(s, { type: 'logHabit', date: DAY, habitId: 'diet' }, 'design1');
    expect(more.log[DAY]?.diet).toBe(2);
  });

  it('a mid-day switch counts a started frequency habit as done in Design 2', () => {
    let s = withWater();
    for (let i = 0; i < 3; i++)
      s = trackerReducer(s, { type: 'logHabit', date: DAY, habitId: 'diet' });
    const after = trackerReducer(s, { type: 'logHabit', date: DAY, habitId: 'diet' }, 'design2');
    expect(after).toBe(s);
    expect(s.log[DAY]?.diet).toBe(3);
  });

  it('works out the Activity Bar target from one tap per habit in Design 2', () => {
    const d1 = trackerReducer(withWater(), { type: 'lockDays', today: DAY }, 'design1');
    const d2 = trackerReducer(withWater(), { type: 'lockDays', today: DAY }, 'design2');
    expect(d2.targets[DAY]).toBeLessThan(d1.targets[DAY] ?? 0);
  });
});

describe('design tally', () => {
  it('tags each log and slip with the design it was made in', () => {
    let s = trackerReducer(
      withWater(),
      { type: 'logHabit', date: DAY, habitId: 'sleep' },
      'design1',
    );
    s = trackerReducer(s, { type: 'logSlip', date: DAY, badHabitId: 'bad-soda-2' }, 'design2');
    s = trackerReducer(s, { type: 'logSlip', date: DAY, badHabitId: 'bad-soda-2' }, 'design2');
    expect(s.designTallies[DAY]).toEqual({
      design1: { logs: 1, slips: 0 },
      design2: { logs: 0, slips: 2 },
    });
  });

  it('Undo and the stepper take the tally back down', () => {
    let s = trackerReducer(
      withWater(),
      { type: 'logHabit', date: DAY, habitId: 'sleep' },
      'design2',
    );
    s = trackerReducer(s, { type: 'undoLog', date: DAY, habitId: 'sleep' }, 'design2');
    s = trackerReducer(
      s,
      { type: 'setSlips', date: DAY, badHabitId: 'bad-soda-2', count: 3 },
      'design2',
    );
    s = trackerReducer(
      s,
      { type: 'setSlips', date: DAY, badHabitId: 'bad-soda-2', count: 1 },
      'design2',
    );
    expect(s.designTallies[DAY]?.design2).toEqual({ logs: 0, slips: 1 });
  });
});

describe('designView', () => {
  it('is the saved state itself in Design 1', () => {
    const s = withWater();
    expect(designView(s, 'design1')).toBe(s);
  });

  it('Design 2 shows one tap per habit and hides mirror bad habits, without changing the save', () => {
    const s = withWater();
    const view = designView(s, 'design2');
    expect(view.habits.find((h) => h.id === 'diet')?.timesPerDay).toBeUndefined();
    expect(view.badHabits.map((b) => b.name)).toEqual(['Soda']);
    expect(s.badHabits).toHaveLength(2);
    expect(s.habits.find((h) => h.id === 'diet')?.timesPerDay).toBe(8);
  });
});

describe('isMirrorBadHabit', () => {
  it('matches catalog mirrors by id or by name', () => {
    expect(isMirrorBadHabit({ id: 'bad-sedentary-9', name: 'Couch' })).toBe(true);
    expect(isMirrorBadHabit({ id: 'bad-habit-9', name: 'poor sleep' })).toBe(true);
    expect(isMirrorBadHabit({ id: 'bad-eat-out-9', name: 'Eat Out' })).toBe(false);
  });
});

describe('setDesign', () => {
  it('changes no tracker and saves nothing', () => {
    const app = createAppState();
    const next = appReducer(app, { type: 'setDesign', design: 'design2' });
    expect(next.design).toBe('design2');
    expect(next.real).toBe(app.real);
    expect(next.test).toBe(app.test);
    expect(savesFor(app, next)).toEqual([]);
  });

  it('later taps use the design in use', () => {
    const app = appReducer(withWaterApp(), { type: 'setDesign', design: 'design2' });
    const next = appReducer(app, {
      type: 'tracker',
      action: { type: 'logHabit', date: DAY, habitId: 'diet' },
      realDate: DAY,
    });
    expect(next.real.state.designTallies[DAY]?.design2?.logs).toBe(1);
  });
});

function withWaterApp() {
  const app = createAppState();
  return { ...app, real: { ...app.real, state: withWater() } };
}
