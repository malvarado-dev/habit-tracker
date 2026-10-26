/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

import { historyDay, lockDays } from '@/rules/locking';
import { EVERY_DAY, type Habit } from '@/rules/habits';
import { sceneLevel } from '@/rules/sky';

// Acceptance (T23): the Day screen shows the Background and critter like Today.
const read = (p: string) => readFileSync(join(__dirname, p), 'utf8');
const dayScreen = read('../app/day/[date].tsx');
const today = read('../app/index.tsx');
const scene = read('SceneLayout.tsx');
const hook = read('useCritterWake.ts');

describe('acceptance: Day screen scene (T23)', () => {
  it.each(['day-screen', 'day-back', 'day-status', 'day-habit-list'])('has test ID %s', (id) => {
    expect(dayScreen).toContain(`"${id}"`);
  });

  it('the shared layout keeps the Background, critter, sheet, and History IDs', () => {
    for (const id of ['habit-sheet', 'background-card', 'wide-history', 'wide-page']) {
      expect(scene).toContain(`"${id}"`);
    }
    expect(scene).toContain('<Background');
    expect(scene).toContain('<Critter');
    expect(scene).toContain('<HistoryView');
  });

  it('the small face next to the date is gone (the real critter shows it now)', () => {
    expect(dayScreen).not.toContain('CritterFace');
    expect(dayScreen).not.toContain('day-face');
  });

  it('the sky follows the saved result (sceneLevel) and the live clock', () => {
    expect(dayScreen).toContain('sceneLevel(historyDay(state, date))');
    expect(dayScreen).toContain('getSkyTime(new Date().getHours())');
  });

  it('wide History switches the shown day in place', () => {
    expect(dayScreen).toContain('router.setParams({ date: next })');
  });

  it('both screens only wake the critter while showing', () => {
    expect(today).toContain('useCritterWake(today, logKey, focused)');
    expect(dayScreen).toContain('useCritterWake(date, logKey, focused)');
    expect(hook).toContain('if (active) setWoken(true);');
  });

  it('no raw hex colors in the new files', () => {
    for (const source of [dayScreen, scene, today]) {
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    }
  });
});

describe('acceptance: History shows the new result on return (T23)', () => {
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
  ];
  const TODAY = '2026-10-14';
  const OPEN = '2026-10-13';
  const base = { habits, removed: [], targets: {}, locked: {}, lockedThrough: null };

  it('an open day edited on the Day screen shows its new result in History', () => {
    const before = { ...base, log: { [OPEN]: { sleep: 1 } } };
    expect(historyDay(before, OPEN).outcome).toBe('none');
    expect(sceneLevel(historyDay(before, OPEN))).toBe('awake');
    const after = { ...base, log: { [OPEN]: { sleep: 1, diet: 1 } } };
    expect(historyDay(after, OPEN).outcome).toBe('checkIn');
    expect(sceneLevel(historyDay(after, OPEN))).toBe('full');
  });

  it('a day with no logs shows the critter asleep', () => {
    expect(sceneLevel(historyDay({ ...base, log: {} }, OPEN))).toBe('asleep');
  });

  it('a locked day keeps its saved sky even if the log changes later', () => {
    const OLD = '2026-10-10';
    const locked = lockDays({ ...base, log: { [OLD]: { sleep: 1 } } }, TODAY);
    const edited = { ...locked, log: { [OLD]: { sleep: 1, diet: 1 } } };
    expect(sceneLevel(historyDay(edited, OLD))).toBe('awake');
  });
});
