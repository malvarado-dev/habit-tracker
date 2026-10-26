// QA-02: user data is always covered end to end (TESTING.md, rule 5). Logs survive a reload,
// and Test mode never changes Real data.
import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import { HomePage } from './pages/HomePage';
import { TestToolsPage } from './pages/TestToolsPage';

const HABITS = [dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)];
/** Where the app keeps the Real save (src/features/tracker/modes.ts, REAL_KEY). */
const REAL_KEY = 'habit-tracker/prototype';

/** Real's logs, slips and skips as saved on the device. The app's own bookkeeping on launch
 * (today's target, the lock date) is left out on purpose. */
async function realActivity(page: import('@playwright/test').Page) {
  const saved = await page.evaluate((key) => localStorage.getItem(key), REAL_KEY);
  const { log, slips, skips } = JSON.parse(saved ?? '{}');
  return { log, slips, skips };
}

test.describe('user data (QA-02)', () => {
  test('logs survive closing and reopening the app', async ({ page }) => {
    await openWithSave(page, saveWith(HABITS));
    const home = new HomePage(page);
    await home.waitUntilReady();
    await home.tapHabit('water');
    await expect(home.count('water')).toHaveText('1/3');

    await page.reload();
    await home.waitUntilReady();
    await expect(home.count('water')).toHaveText('1/3');
  });

  test('Test mode never changes Real data', async ({ page }) => {
    await openWithSave(page, saveWith(HABITS), 'test-tools');

    const tools = new TestToolsPage(page);
    await tools.waitUntilReady();
    await tools.useTestData();
    await tools.back.click();
    const home = new HomePage(page);
    await home.waitUntilReady();
    // Test mode starts from its own default habits; Sleep is one of them.
    await home.tapHabit('sleep');
    await expect(home.undoBar).toBeVisible();

    // The Real save on the device has no logs, slips or skips...
    expect(await realActivity(page)).toEqual({ log: {}, slips: {}, skips: {} });

    // ...and switching back to Real shows Sleep still to do and Water at 0.
    await page.goto('test-tools');
    await tools.waitUntilReady();
    await page.getByTestId('mode-real').click();
    await tools.back.click();
    await home.waitUntilReady();
    await expect(home.card('sleep')).toBeVisible();
    await expect(home.count('water')).toHaveText('0/3');
  });
});
