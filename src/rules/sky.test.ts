import { describe, expect, it } from '@jest/globals';
import { getActivityBar } from './activityBar';
import { EVERY_DAY, type Habit } from './habits';
import { dayResult } from './locking';
import { getSkyLevel, getSkyTime, sceneLevel, statusBarStyle } from './sky';

const habits: Habit[] = [
  {
    id: 'sleep',
    name: 'Sleep',
    schedule: { kind: 'specificDays', days: EVERY_DAY },
    color: 'habit1',
  },
  {
    id: 'diet',
    name: 'Diet',
    schedule: { kind: 'specificDays', days: EVERY_DAY },
    color: 'habit1',
  },
  {
    id: 'read',
    name: 'Read',
    schedule: { kind: 'specificDays', days: EVERY_DAY },
    color: 'habit1',
  },
];
const MON = '2026-10-12';

describe('getSkyLevel follows the Activity Bar (P2-08a)', () => {
  it('is asleep before the first log', () => {
    expect(getSkyLevel(getActivityBar(habits, {}, MON))).toBe('asleep');
  });

  it('is awake while logging, and full once the bar fills', () => {
    expect(getSkyLevel(getActivityBar(habits, { [MON]: { sleep: 1 } }, MON))).toBe('awake');
    expect(getSkyLevel(getActivityBar(habits, { [MON]: { sleep: 1, diet: 1 } }, MON))).toBe('full');
  });

  it('shows a calm Rest day sky when there is nothing to log', () => {
    expect(getSkyLevel(getActivityBar([], {}, MON))).toBe('rest');
  });
});

describe('getSkyTime', () => {
  it.each([
    [5, 'night'],
    [6, 'day'],
    [16, 'day'],
    [17, 'dusk'],
    [19, 'dusk'],
    [20, 'night'],
    [0, 'night'],
  ])('hour %d shows the %s sky', (hour, expected) => {
    expect(getSkyTime(hour)).toBe(expected);
  });
});

describe('statusBarStyle', () => {
  it('follows the sky, not the theme: dark icons by day, light at dusk and night', () => {
    expect(statusBarStyle('day')).toBe('dark');
    expect(statusBarStyle('dusk')).toBe('light');
    expect(statusBarStyle('night')).toBe('light');
  });
});

describe('acceptance: Day screen sky and critter (T23)', () => {
  it('a day with no logs is a quiet sky with the critter asleep', () => {
    expect(sceneLevel({ outcome: 'none', logs: 0, target: 2 })).toBe('asleep');
  });

  it('a day that fell short is awake; a check-in is full; a Rest day is calm', () => {
    expect(sceneLevel({ outcome: 'none', logs: 1, target: 2 })).toBe('awake');
    expect(sceneLevel({ outcome: 'checkIn', logs: 2, target: 2 })).toBe('full');
    expect(sceneLevel({ outcome: 'rest', logs: 0, target: 0 })).toBe('rest');
  });

  it('matches Today for the same open day', () => {
    const log = { [MON]: { sleep: 1 } };
    expect(sceneLevel(dayResult(habits, log, MON))).toBe(
      getSkyLevel(getActivityBar(habits, log, MON)),
    );
  });
});
