// Test data for the Playwright tests (Test Architecture: "Test data builders" and "Independent
// tests"). Every test opens the app on a known save and a fixed clock, so tests never depend on
// each other, on today's date, or on what's already in the browser.
import { test as base, type Page } from '@playwright/test';

import type { TrackerState } from '../../src/features/tracker/state';
import type { BadHabit } from '../../src/rules/badHabits';
import type { Habit } from '../../src/rules/habits';
import { HomePage } from './pages/HomePage';

/** Where the app keeps the Real save (src/features/tracker/modes.ts, REAL_KEY). */
const REAL_KEY = 'habit-tracker/prototype';

/** A Sunday morning. The sky and every date rule see this time, not the real one. */
export const FIXED_NOW = new Date('2026-10-25T09:00:00');

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6] as const;

/** A habit due every day. Pass timesPerDay above 1 for a frequency habit with a ring. */
export function dailyHabit(id: string, name: string, timesPerDay = 1): Habit {
  return {
    id,
    name,
    color: 'habit1',
    schedule: { kind: 'specificDays', days: [...EVERY_DAY] },
    ...(timesPerDay > 1 ? { timesPerDay } : {}),
  };
}

/** A current save with these habits (and bad habits) and nothing logged yet. */
export function saveWith(habits: Habit[], badHabits: BadHabit[] = []): TrackerState {
  return {
    version: 14,
    pet: { loveAdjust: 0, confidenceAdjust: 0 },
    quests: { heal: { acceptedOn: null, claimedOn: null } },
    habits,
    removed: [],
    log: {},
    targets: {},
    badHabits,
    slips: {},
    designTallies: {},
    skips: {},
    locked: {},
    lockedThrough: null,
  };
}

/** Puts a save in the browser before the app's own code runs, then opens Today. */
export async function openWithSave(page: Page, save: TrackerState, path = ''): Promise<void> {
  await page.clock.setFixedTime(FIXED_NOW);
  // The save goes in once per test: later page loads keep whatever the app saved, so a test can
  // add a habit on one screen and find it on another.
  await page.addInitScript(
    ([key, value]) => {
      if (window.sessionStorage.getItem('e2e-seeded')) return;
      window.localStorage.setItem(key, value);
      window.sessionStorage.setItem('e2e-seeded', '1');
    },
    [REAL_KEY, JSON.stringify(save)] as const,
  );
  await page.goto(path);
}

/**
 * `home` is a fixture: any test that asks for it gets a Today page opened on the default save
 * (Sleep once a day, Water 3 times a day). Tests that need other data call openWithSave first.
 */
export const test = base.extend<{ home: HomePage }>({
  home: async ({ page }, use) => {
    await openWithSave(
      page,
      saveWith([dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)]),
    );
    const home = new HomePage(page);
    await home.waitUntilReady();
    await use(home);
  },
});

export { expect } from '@playwright/test';
