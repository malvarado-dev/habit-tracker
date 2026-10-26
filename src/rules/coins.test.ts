// P2-08c: Coins from logs.
import { describe, expect, it } from '@jest/globals';
import { trackerReducer, createInitialState, type TrackerState } from '@/features/tracker/state';
import { allHabits } from './locking';
import { dayCoins, totalCoins, type CoinRules } from './coins';

const DAY = '2026-10-25';
const YESTERDAY = '2026-10-24';
const RULES: CoinRules = { perLog: 1, logsPerHabitPerDay: 3, dailyCap: null };

const source = (s: TrackerState) => ({ ...s, habits: allHabits(s) });

function start(): TrackerState {
  const s = createInitialState();
  return {
    ...s,
    habits: s.habits.map((h) => (h.id === 'diet' ? { ...h, timesPerDay: 6 } : h)),
    badHabits: [
      { id: 'eat-out', name: 'Eat Out', pairedWith: 'diet' },
      { id: 'soda', name: 'Soda' },
    ],
  };
}

const log = (s: TrackerState, habitId: string, date = DAY) =>
  trackerReducer(s, { type: 'logHabit', date, habitId });

describe('Coins from logs', () => {
  it('each log earns Coins', () => {
    const s = log(log(start(), 'sleep'), 'diet');
    expect(totalCoins(source(s), RULES)).toBe(2);
  });

  it('only the first 3 logs per habit per day earn', () => {
    let s = start();
    for (let i = 0; i < 5; i++) s = log(s, 'diet');
    expect(s.log[DAY]?.diet).toBe(5);
    expect(dayCoins(source(s), DAY, RULES)).toBe(3);
  });

  it('a linked slip (slate) earns like a gold log, inside the same cap', () => {
    let s = log(start(), 'diet');
    s = trackerReducer(s, { type: 'logSlip', date: DAY, badHabitId: 'eat-out' });
    s = trackerReducer(s, { type: 'logSlip', date: DAY, badHabitId: 'eat-out' });
    s = trackerReducer(s, { type: 'logSlip', date: DAY, badHabitId: 'eat-out' });
    expect(dayCoins(source(s), DAY, RULES)).toBe(3);
  });

  it('standalone slips earn nothing', () => {
    const s = trackerReducer(start(), {
      type: 'setSlips',
      date: DAY,
      badHabitId: 'soda',
      count: 4,
    });
    expect(totalCoins(source(s), RULES)).toBe(0);
  });

  it('logs past a full Activity Bar still earn', () => {
    let s = start();
    for (const id of ['sleep', 'wellbeing', 'exercise', 'diet', 'diet', 'diet']) s = log(s, id);
    expect(dayCoins(source(s), DAY, RULES)).toBe(6);
  });

  it('Undo takes the Coins back', () => {
    const s = trackerReducer(log(start(), 'sleep'), {
      type: 'undoLog',
      date: DAY,
      habitId: 'sleep',
    });
    expect(totalCoins(source(s), RULES)).toBe(0);
  });

  it('a past-day fix earns once per log, and re-logging after Undo never double-earns', () => {
    let s = log(start(), 'sleep', YESTERDAY);
    s = trackerReducer(s, { type: 'undoLog', date: YESTERDAY, habitId: 'sleep' });
    s = log(s, 'sleep', YESTERDAY);
    expect(dayCoins(source(s), YESTERDAY, RULES)).toBe(1);
    expect(totalCoins(source(s), RULES)).toBe(1);
  });

  it('a removed habit keeps the Coins its logs earned', () => {
    let s = log(start(), 'sleep', YESTERDAY);
    s = trackerReducer(s, { type: 'removeHabit', date: DAY, habitId: 'sleep' });
    expect(totalCoins(source(s), RULES)).toBe(1);
  });

  it('per log value and daily cap come from the rules', () => {
    let s = start();
    for (const id of ['sleep', 'wellbeing', 'exercise']) s = log(s, id);
    expect(dayCoins(source(s), DAY, { perLog: 5, logsPerHabitPerDay: 3, dailyCap: 10 })).toBe(10);
  });
});
