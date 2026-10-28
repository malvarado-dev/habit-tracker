import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { toDateKey } from '../../src/rules/dates';
import { BadHabitsTray } from './pages/BadHabitsTray';
import { HistoryPage } from './pages/HistoryPage';

const TODAY = toDateKey(FIXED_NOW);

// Full-app risk: chip recovery must survive reload and stay scoped to the selected day.
test('re-adding a missed habit restores its linked zero-count chip (#146)', async ({ page }) => {
  const state = saveWith(
    [dailyHabit('eat', 'Eat Healthy', 3)],
    [{ id: 'fast-food', name: 'Fast Food', pairedWith: 'eat' }],
  );
  state.slips = { [TODAY]: { 'fast-food': 1 } };
  await openWithSave(page, state, 'history');
  const history = new HistoryPage(page);
  const tray = new BadHabitsTray(page);
  await tray.tap('fast-food');
  await tray.minus.click();
  await expect(tray.badge('fast-food')).toHaveText('0');
  await tray.closeStepper();
  await expect(tray.chip('fast-food')).toHaveCount(0);
  await expect(history.card('eat')).toHaveCount(0);
  await history.missedToggle.click();
  await history.missedList.getByTestId('habit-card-eat').click();
  await expect(history.count('eat')).toHaveText('1/3');
  await expect(tray.chip('fast-food')).toBeVisible();
  await expect(tray.badge('fast-food')).toHaveText('0');
  await page.reload();
  await expect(tray.chip('fast-food')).toBeVisible();
  await expect(tray.badge('fast-food')).toHaveText('0');
  await history.selectDay('2026-10-24');
  await expect(tray.chip('fast-food')).toHaveCount(0);
  await history.selectDay(TODAY);
  await tray.tap('fast-food');
  await tray.plus.click();
  await tray.closeStepper();
  await expect(tray.badge('fast-food')).toHaveText('1');
  await expect(history.count('eat')).toHaveText('2/3');
  await page.reload();
  await expect(tray.badge('fast-food')).toHaveText('1');
  await expect(history.count('eat')).toHaveText('2/3');
});
