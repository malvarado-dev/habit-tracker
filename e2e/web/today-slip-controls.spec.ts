// #141: opening controls must never record a slip. Exercise the popup in both designs/themes.
import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { BadHabitsTray } from './pages/BadHabitsTray';
import { HomePage } from './pages/HomePage';
import { TestToolsPage } from './pages/TestToolsPage';

const SAVE = saveWith([dailyHabit('sleep', 'Sleep')], [{ id: 'soda', name: 'Soda' }]);

for (const design of ['design1', 'design2'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${design}, ${theme}: tap opens controls without a slip; edits save without Undo`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.clock.install({ time: FIXED_NOW });
      await openWithSave(page, SAVE, 'test-tools');
      const tools = new TestToolsPage(page);
      await tools.pickDesign(design);
      await tools.back.click();
      const home = new HomePage(page);
      await home.waitUntilReady();
      const tray = new BadHabitsTray(page);

      await tray.chip('soda').click();
      await expect(tray.badge('soda')).toHaveText('0');
      await expect(tray.stepper).toBeVisible();
      await expect(tray.stepper).toHaveText('−+');
      await expect(tray.stepper).toHaveCSS('background-color', 'rgb(31, 31, 31)');
      await expect(tray.minus.getByText('−')).toHaveCSS('color', 'rgb(255, 255, 255)');
      await expect(tray.plus).toHaveCSS('background-color', 'rgb(245, 240, 74)');
      await expect(tray.plus.getByText('+', { exact: true })).toHaveCSS('color', 'rgb(31, 31, 31)');
      await expect(tray.tray.getByText('Tap to adjust slips.')).toBeVisible();
      await expect(tray.minus).toBeDisabled();
      await expect(home.undoBar).toBeHidden();

      await page.clock.fastForward(60_000);
      await expect(tray.stepper).toBeVisible();
      await tray.plus.click();
      await tray.plus.click();
      await tray.minus.click();
      await expect(tray.badge('soda')).toHaveText('1');
      await tray.minus.click();
      await expect(tray.badge('soda')).toHaveText('0');
      await expect(tray.minus).toBeDisabled();
      await tray.plus.click();
      await tray.closeStepper();
      await expect(tray.badge('soda')).toHaveText('1');
      await home.expectBar('Activity Bar, 0 of 1 log today');
      await expect(home.undoBar).toBeHidden();

      await tray.chip('soda').click();
      await expect(tray.badge('soda')).toHaveText('1');
      await tray.minus.click();
      await expect(tray.badge('soda')).toHaveText('0');
      await tray.plus.click();
      await tray.closeStepper();
      await page.reload();
      await home.waitUntilReady();
      await expect(tray.badge('soda')).toHaveText('1');
    });
  }
}

test('popup has only minus and plus; its live count stays on the chip (#141)', async ({ page }) => {
  await openWithSave(page, SAVE);
  const tray = new BadHabitsTray(page);
  await tray.longPress('soda');
  await expect(tray.stepper).toHaveText('−+');
  await tray.plus.click();
  await expect(tray.badge('soda')).toHaveText('1');
  await expect(tray.plus).toHaveAccessibleName('One more Soda, 1 slip');
});

test('Test popup edits survive reload and leave Real slips unchanged (#141)', async ({ page }) => {
  await page.addInitScript((save) => {
    if (sessionStorage.getItem('slip-test-seeded')) return;
    localStorage.setItem('habit-tracker/prototype-test', JSON.stringify(save));
    sessionStorage.setItem('slip-test-seeded', '1');
  }, SAVE);
  await openWithSave(page, SAVE, 'test-tools');
  const tools = new TestToolsPage(page);
  await tools.useTestData();
  await tools.back.click();
  const tray = new BadHabitsTray(page);
  await tray.chip('soda').click();
  await expect(tray.badge('soda')).toHaveText('0');
  await tray.plus.click();
  await tray.closeStepper();
  await page.reload();
  await expect(tray.badge('soda')).toHaveText('1');
  await page.goto('test-tools');
  await page.getByTestId('mode-real').click();
  await tools.back.click();
  await expect(tray.badge('soda')).toHaveText('0');
  await page.reload();
  await expect(tray.badge('soda')).toHaveText('0');
});
