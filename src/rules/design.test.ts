import { describe, expect, it } from '@jest/globals';
import { addToTally, habitsForDesign, timesFor } from './design';
import { EVERY_DAY, type Habit } from './habits';

const water: Habit = {
  id: 'water',
  name: 'Water',
  schedule: { kind: 'specificDays', days: EVERY_DAY },
  color: 'habit1',
  timesPerDay: 8,
};
const sleep: Habit = { ...water, id: 'sleep', name: 'Sleep', timesPerDay: undefined };

describe('timesFor', () => {
  it('keeps the frequency in Design 1', () => {
    expect(timesFor(water, 'design1')).toBe(8);
  });
  it('is always one tap in Design 2', () => {
    expect(timesFor(water, 'design2')).toBe(1);
    expect(timesFor(sleep, 'design2')).toBe(1);
  });
});

describe('habitsForDesign', () => {
  it('returns the same habits in Design 1', () => {
    const habits = [water, sleep];
    expect(habitsForDesign(habits, 'design1')).toBe(habits);
  });
  it('drops the frequency in Design 2 without changing the saved habit', () => {
    const [w] = habitsForDesign([water], 'design2');
    expect(w?.timesPerDay).toBeUndefined();
    expect(water.timesPerDay).toBe(8);
  });
});

describe('addToTally', () => {
  it('counts logs and slips per design and day', () => {
    let t = addToTally({}, '2026-10-25', 'design1', { logs: 1 });
    t = addToTally(t, '2026-10-25', 'design2', { slips: 2 });
    expect(t).toEqual({
      '2026-10-25': { design1: { logs: 1, slips: 0 }, design2: { logs: 0, slips: 2 } },
    });
  });
  it('never goes below 0, and returns the same object when nothing changes', () => {
    const t = addToTally({}, '2026-10-25', 'design1', { logs: -1 });
    expect(t).toEqual({});
  });
});
