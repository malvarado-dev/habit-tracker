// P2-09 end-to-end tests: adding a bad habit from Add habit, then counting slips in the tray.
// The default habits (Sleep once a day, Water 3 times) make the Activity Bar full at 3 logs, so the
// tests can check that slips never move it.
import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import { BadHabitsTray } from './pages/BadHabitsTray';
import { HomePage } from './pages/HomePage';

const HABITS = [dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)];
const SODA = { id: 'soda', name: 'Soda' };

test.describe('bad habits (P2-09)', () => {
  test('a bad habit added from Add habit shows in the tray at 0', async ({ page }) => {
    await openWithSave(page, saveWith(HABITS), 'habits');
    await page.getByTestId('habits-add').click();
    await expect(page.getByTestId('pick-bad-habits')).toBeVisible();

    await page.getByTestId('pick-bad-soda').click();
    await expect(page.getByTestId('add-bad-name')).toHaveValue('Soda');
    await page.getByTestId('add-bad-confirm').click();
    await expect(page.getByTestId('habits-screen')).toBeVisible();

    await page.goto('');
    const tray = new BadHabitsTray(page);
    await expect(tray.chip(await soloId(page))).toBeVisible();
    await expect(tray.tray.getByText('Soda')).toBeVisible();
    await expect(tray.tray.getByText('0')).toBeVisible();
  });

  test('a popup increase counts one slip without Undo or Activity Bar progress', async ({
    page,
  }) => {
    await openWithSave(page, saveWith(HABITS, [SODA]));
    const home = new HomePage(page);
    const tray = new BadHabitsTray(page);
    await home.waitUntilReady();

    await tray.countSlip('soda');
    await expect(tray.badge('soda')).toHaveText('1');
    await expect(home.undoBar).toBeHidden();
    await home.expectBar('Activity Bar, 0 of 3 logs today');

    await tray.tap('soda');
    await tray.minus.click();
    await tray.closeStepper();
    await expect(tray.badge('soda')).toHaveText('0');
  });

  test('long-press opens the stepper; plus and minus change the count, never below 0', async ({
    page,
  }) => {
    await openWithSave(page, saveWith(HABITS, [SODA]));
    const tray = new BadHabitsTray(page);
    await new HomePage(page).waitUntilReady();

    await tray.longPress('soda');
    await tray.plus.click();
    await tray.plus.click();
    await expect(tray.badge('soda')).toHaveText('2');

    await tray.minus.click();
    await tray.minus.click();
    await expect(tray.badge('soda')).toHaveText('0');
    await expect(tray.minus).toBeDisabled();

    await tray.closeStepper();
    await expect(tray.badge('soda')).toHaveText('0');
  });

  test('a bad habit paired with a good habit stays out of the tray', async ({ page }) => {
    await openWithSave(
      page,
      saveWith(HABITS, [SODA, { id: 'poor-sleep', name: 'Poor Sleep', pairedWith: 'sleep' }]),
    );
    const tray = new BadHabitsTray(page);
    await new HomePage(page).waitUntilReady();

    await expect(tray.chip('soda')).toBeVisible();
    await expect(tray.chip('poor-sleep')).toHaveCount(0);
  });
});

/** The id the app gave the bad habit it just added (ids include the time they were made). */
async function soloId(page: import('@playwright/test').Page): Promise<string> {
  const testId = await page
    .locator('[data-testid^="bad-chip-"]')
    .first()
    .getAttribute('data-testid');
  return (testId ?? '').replace('bad-chip-', '');
}
