import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { toDateKey } from '../../src/rules/dates';
import { tuning } from '../../src/config/tuning';
import { BadHabitsTray } from './pages/BadHabitsTray';

const TODAY = toDateKey(FIXED_NOW);

for (const theme of ['light', 'dark'] as const) {
  test(`once-daily History ring shows linked slips in ${theme} (#146)`, async ({ page }) => {
    const state = saveWith(
      [dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)],
      [
        { id: 'poor-sleep', name: 'Poor Sleep', pairedWith: 'sleep' },
        { id: 'soda', name: 'Soda', pairedWith: 'water' },
      ],
    );
    state.log = { [TODAY]: { sleep: 1, water: 2 } };
    state.slips = { [TODAY]: { soda: 1 } };
    await page.emulateMedia({ colorScheme: theme });
    await openWithSave(page, state, 'history');
    const tray = new BadHabitsTray(page);
    const sleep = page.getByTestId('habit-ring-sleep');
    const water = page.getByTestId('habit-ring-water');
    const gold = `path[stroke="${tuning.ring.gold}"][stroke-dasharray]`;
    const slate = `path[stroke="${tuning.ring.slate}"][stroke-dasharray]`;
    await expect(sleep.locator(gold)).toHaveCount(1);
    await expect(water.locator(gold)).toHaveCount(2);
    await expect(water.locator(slate)).toHaveCount(1);
    await tray.countSlip('poor-sleep');
    await expect(sleep.locator(slate)).toHaveCount(1);
    await expect(sleep.locator(gold)).toHaveCount(0);
    await page.reload();
    await expect(sleep.locator(slate)).toHaveCount(1);
    await expect(tray.badge('poor-sleep')).toHaveText('1');
    await tray.tap('poor-sleep');
    await tray.minus.click();
    await tray.closeStepper();
    await expect(sleep.locator(gold)).toHaveCount(1);
    await expect(sleep.locator(slate)).toHaveCount(0);
    await expect(page.getByTestId('habit-card-sleep')).toBeVisible();
    await expect(water.locator(gold)).toHaveCount(2);
    await expect(water.locator(slate)).toHaveCount(1);
    await page.reload();
    await expect(sleep.locator(gold)).toHaveCount(1);
    await expect(tray.badge('poor-sleep')).toHaveText('0');
  });
}
