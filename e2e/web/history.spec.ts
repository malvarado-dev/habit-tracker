// P2-18a end-to-end tests: History's calendar, streaks and selected day (#89).
// The fixed clock is Sun Oct 25, 2026. Water (3 a day) and Stretch are due every day; a full
// day logs both in full.
import { addDays, toDateKey } from '../../src/rules/dates';
import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { HistoryPage } from './pages/HistoryPage';

const TODAY = toDateKey(FIXED_NOW);
const back = (n: number) => addDays(TODAY, -n);
const FULL = { water: 3, stretch: 1 };

function save() {
  const s = saveWith(
    [dailyHabit('water', 'Water', 3), dailyHabit('stretch', 'Stretch')],
    [{ id: 'soda', name: 'Soda' }],
  );
  // Full days: the 3 days before today, and 5 days back (a gap on day 4).
  s.log = {
    [back(1)]: FULL,
    [back(2)]: FULL,
    [back(3)]: FULL,
    [back(5)]: FULL,
    [TODAY]: { water: 1 },
  };
  s.slips = { [back(3)]: { soda: 2 } };
  return s;
}

async function openHistory(page: import('@playwright/test').Page): Promise<HistoryPage> {
  await openWithSave(page, save(), 'history');
  const history = new HistoryPage(page);
  await history.waitUntilReady();
  return history;
}

test.describe('History (P2-18a)', () => {
  test('opens on today with streaks and the edit window', async ({ page }) => {
    const history = await openHistory(page);
    await expect(history.month).toHaveText('October 2026');
    await expect(history.streak).toHaveText('3 day streak · Best 3');
    await expect(history.dayTitle).toHaveText('Today, Sun Oct 25');
    await expect(history.dayStatus).toHaveText('Changeable for 2 more days');
  });

  test('full days are banded; a missed day is not', async ({ page }) => {
    const history = await openHistory(page);
    for (const n of [1, 2, 3, 5]) await expect(history.band(back(n))).toBeVisible();
    await expect(history.band(back(4))).toHaveCount(0);
  });

  test('shows only what was logged on the selected day', async ({ page }) => {
    const history = await openHistory(page);
    await expect(history.card('water')).toBeVisible();
    await expect(history.card('stretch')).toHaveCount(0);
    await expect(history.slipChip('soda')).toHaveCount(0);

    await history.selectDay(back(3));
    await expect(history.card('stretch')).toBeVisible();
    await expect(history.slipChip('soda')).toBeVisible();
    await expect(history.dayStatus).toHaveText('Locked in');

    await history.selectDay(back(4));
    await expect(history.empty).toBeVisible();
  });

  test('future days cannot be selected', async ({ page }) => {
    const history = await openHistory(page);
    await expect(history.day(addDays(TODAY, 1))).toBeDisabled();
  });

  test('month arrows stop at the first month with data and at this month', async ({ page }) => {
    const history = await openHistory(page);
    await expect(history.next).toBeDisabled();
    await expect(history.prev).toBeDisabled();
  });

  test('the wide layout shows the new calendar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await openWithSave(page, save());
    const history = new HistoryPage(page);
    await history.waitUntilReady();
    await expect(history.streak).toHaveText('3 day streak · Best 3');
  });
});
