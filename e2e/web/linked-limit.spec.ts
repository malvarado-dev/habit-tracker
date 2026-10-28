import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { toDateKey } from '../../src/rules/dates';
import { BadHabitsTray } from './pages/BadHabitsTray';
import { HomePage } from './pages/HomePage';

const TODAY = toDateKey(FIXED_NOW);

// Full-app risk: Today and History must edit the same limited, persisted count.
test('Today and History share the good-plus-bad daily limit (#146)', async ({ page }) => {
  const state = saveWith(
    [dailyHabit('eat', 'Eat Healthy', 5)],
    [{ id: 'fast-food', name: 'Fast Food', pairedWith: 'eat' }],
  );
  state.log = { [TODAY]: { eat: 3 } };
  await openWithSave(page, state);
  const home = new HomePage(page);
  await home.waitUntilReady();
  await home.slideOpen('eat');
  await home.slideSlip('eat').click();
  await expect(home.count('eat')).toHaveText('4/5');
  await page.goto('history');
  const tray = new BadHabitsTray(page);
  await tray.tap('fast-food');
  await expect(tray.plus).toBeEnabled();
  await tray.plus.click();
  await expect(tray.badge('fast-food')).toHaveText('2');
  await expect(tray.plus).toBeDisabled();
  await tray.minus.click();
  await expect(tray.plus).toBeEnabled();
  await tray.plus.click();
  await expect(tray.plus).toBeDisabled();
  await tray.closeStepper();
  await page.reload();
  await expect(tray.badge('fast-food')).toHaveText('2');
  await tray.tap('fast-food');
  await expect(tray.plus).toBeDisabled();
  await tray.closeStepper();
  await page.goto('/');
  await expect(home.card('eat')).toHaveCount(0);
});
