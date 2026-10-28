// #141/#148: two persistence journeys; control behavior is covered by integration tests.
import { toDateKey } from '../../src/rules/dates';
import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { BadHabitsTray } from './pages/BadHabitsTray';
import { HomePage } from './pages/HomePage';
import { TestToolsPage } from './pages/TestToolsPage';

const SAVE = saveWith([dailyHabit('sleep', 'Sleep')], [{ id: 'soda', name: 'Soda' }]);

// Full-app risk: both design entry points must edit the same persisted slip count.
test('popup edits persist across reload and design changes (#141)', async ({ page }) => {
  await openWithSave(page, SAVE);
  const tray = new BadHabitsTray(page);
  const home = new HomePage(page);
  await tray.tap('soda');
  await expect(tray.badge('soda')).toHaveText('0');
  await tray.plus.click();
  await tray.closeStepper();
  await page.reload();
  await expect(tray.badge('soda')).toHaveText('1');
  await page.goto('test-tools');
  const tools = new TestToolsPage(page);
  await tools.pickDesign('design2');
  await tools.back.click();
  await tray.tap('soda');
  await expect(tray.badge('soda')).toHaveText('1');
  await tray.plus.click();
  await tray.closeStepper();
  await page.reload();
  await expect(tray.badge('soda')).toHaveText('2');
  await home.expectBar('Activity Bar, 0 of 1 log today');
  await expect(home.undoBar).toBeHidden();
});

for (const theme of ['light', 'dark'] as const) {
  test(`bad habit popup rendering in ${theme} @rendering (#141)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openWithSave(page, { ...SAVE, slips: { [toDateKey(FIXED_NOW)]: { soda: 2 } } });
    const tray = new BadHabitsTray(page);
    await tray.tap('soda');
    await expect(tray.stepper).toHaveText('−+');
    await expect(tray.badge('soda')).toHaveText('2');
    await expect(tray.stepper).toHaveCSS('background-color', 'rgb(31, 31, 31)');
    await expect(tray.minus.getByText('−')).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(tray.plus).toHaveCSS('background-color', 'rgb(245, 240, 74)');
    await expect(tray.plus.getByText('+', { exact: true })).toHaveCSS('color', 'rgb(31, 31, 31)');
  });
}

// Full-app risk: Test slip writes must never reach the Real storage key.
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
