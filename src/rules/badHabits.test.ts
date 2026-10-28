import { describe, expect, it } from '@jest/globals';

import { createInitialState, trackerReducer, type TrackerState } from '@/features/tracker/state';
import { getActivityBar } from './activityBar';
import {
  cleanCount,
  isPaired,
  pairingLine,
  slipCount,
  trayHabits,
  type BadHabit,
} from './badHabits';
import { allHabits, lockDays } from './locking';

const DAY = '2026-10-25';
const soda: BadHabit = { id: 'soda', name: 'Soda' };
const poorSleep: BadHabit = { id: 'poor-sleep', name: 'Poor Sleep', pairedWith: 'sleep' };

const withBad = (...bad: BadHabit[]): TrackerState => ({ ...createInitialState(), badHabits: bad });
const run = (state: TrackerState, ...actions: Parameters<typeof trackerReducer>[1][]) =>
  actions.reduce((s, a) => trackerReducer(s, a), state);

describe('which bad habits show in the tray (P2-09)', () => {
  const habits = createInitialState().habits;
  it('management describes existing partners and falls back when a partner is removed', () => {
    expect(pairingLine(poorSleep, habits)).toBe('With Sleep');
    expect(pairingLine(soda, habits)).toBe('');
    expect(pairingLine(poorSleep, [])).toBe('');
  });

  it('Design 1 shows only standalone bad habits; paired ones log from their card', () => {
    expect(trayHabits([soda, poorSleep], habits, 'design1')).toEqual([soda]);
  });

  it('Design 2 shows every bad habit, since it has no pairing', () => {
    expect(trayHabits([soda, poorSleep], habits, 'design2')).toEqual([soda, poorSleep]);
  });

  it('a pairing to a habit the user no longer has falls back to the tray', () => {
    const orphan = { ...poorSleep, pairedWith: 'gone' };
    expect(isPaired(orphan, habits)).toBe(false);
    expect(trayHabits([orphan], habits, 'design1')).toEqual([orphan]);
  });
});

describe('counting slips', () => {
  const slip = { type: 'logSlip', date: DAY, badHabitId: 'soda' } as const;

  it('a tap adds 1', () => {
    const state = run(withBad(soda), slip, slip);
    expect(slipCount(state.slips, DAY, 'soda')).toBe(2);
  });

  it('the stepper sets the count, never below 0', () => {
    const state = run(withBad(soda), slip, {
      type: 'setSlips',
      date: DAY,
      badHabitId: 'soda',
      count: -3,
    });
    expect(slipCount(state.slips, DAY, 'soda')).toBe(0);
    expect(state.slips[DAY]).toEqual({});
    expect(cleanCount(2.6)).toBe(3);
    expect(cleanCount(Number.NaN)).toBe(0);
  });

  it('a slip for a bad habit that does not exist is ignored', () => {
    const state = withBad(soda);
    expect(run(state, { type: 'logSlip', date: DAY, badHabitId: 'nope' })).toBe(state);
  });

  it('a locked day never changes', () => {
    const state = lockDays(withBad(soda), '2026-10-30');
    expect(run(state, slip)).toBe(state);
  });

  it('slips earn no Activity Bar progress (PRD-15)', () => {
    const before = withBad(soda);
    const after = run(before, slip, slip, slip);
    const bar = (s: TrackerState) => getActivityBar(allHabits(s), s.log, DAY, s.targets[DAY]);
    expect(bar(after).logs).toBe(0);
    expect(bar(after).fill).toBe(bar(before).fill);
    expect(after.log).toEqual(before.log);
  });
});

describe('adding a bad habit', () => {
  const add = (name: string, pairedWith?: string) =>
    ({ type: 'addBadHabit', id: name, name, date: DAY, pairedWith }) as const;

  it('adds a cleaned name, paired or standalone', () => {
    const state = run(createInitialState(), add('  Soda '), add('Poor Sleep', 'sleep'));
    expect(state.badHabits).toEqual([
      { id: '  Soda ', name: 'Soda', addedOn: DAY },
      { id: 'Poor Sleep', name: 'Poor Sleep', addedOn: DAY, pairedWith: 'sleep' },
    ]);
  });

  it('a pairing to a habit the user does not have is dropped', () => {
    const state = run(createInitialState(), add('Eat Out', 'eat-healthy'));
    expect(state.badHabits[0]?.pairedWith).toBeUndefined();
  });

  it('names are shared with good habits: no blanks or duplicates', () => {
    const state = run(createInitialState(), add(' '), add('sleep'), add('Soda'), add('SODA'));
    expect(state.badHabits.map((b) => b.name)).toEqual(['Soda']);
    // A good habit can't take a bad habit's name either.
    const good = run(state, { type: 'addHabit', id: 'x', name: 'Soda', date: DAY });
    expect(good.habits).toHaveLength(state.habits.length);
  });
});
