// P2-16 end-to-end tests: Explore (#87). The rules are unit tested (explore.test.ts); this covers
// the journey and the user data risks: exploring survives a reload, and the reward is paid once.
import { exploreReward } from '../../src/rules/explore';
import { toDateKey } from '../../src/rules/dates';
import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { HomePage } from './pages/HomePage';
import { TestToolsPage } from './pages/TestToolsPage';

test.describe('Explore (P2-16)', () => {
  test('a full bar offers Explore once; the neighborhood shows and stays after a reload', async ({
    page,
  }) => {
    await openWithSave(page, saveWith([dailyHabit('sleep', 'Sleep')]));
    const home = new HomePage(page);
    await home.waitUntilReady();
    await expect(page.getByTestId('explore-button')).toHaveCount(0);

    await home.tapHabit('sleep');
    await page.getByTestId('explore-button').click();
    await expect(page.getByTestId('explore-scene')).toBeVisible();
    await expect(page.getByTestId('explore-button')).toHaveCount(0);

    await page.reload();
    await home.waitUntilReady();
    await expect(page.getByTestId('explore-scene')).toBeVisible();
    await expect(page.getByTestId('explore-button')).toHaveCount(0);
  });

  test('the next day reveals the Coins once and brings the pet home', async ({ page }) => {
    await openWithSave(page, saveWith([dailyHabit('sleep', 'Sleep')]), 'test-tools');
    const tools = new TestToolsPage(page);
    await tools.waitUntilReady();
    await tools.useTestData();
    await page.getByTestId('send-exploring').click();
    await tools.back.click();
    const home = new HomePage(page);
    await home.waitUntilReady();
    await expect(page.getByTestId('explore-scene')).toBeVisible();
    const before = Number(await home.coinBalance.textContent());

    await page.goto('test-tools');
    await tools.waitUntilReady();
    await page.getByTestId('next-day-button').click();
    await tools.back.click();
    await home.waitUntilReady();
    await expect(page.getByTestId('moment-caption')).toContainText(/Neko found \d+ Coins\./);
    await expect(page.getByTestId('explore-scene')).toHaveCount(0);
    // The Coins count up, so wait for the exact balance: the reward is fixed for the date.
    const after = before + exploreReward(toDateKey(FIXED_NOW));
    await expect(home.coinBalance).toHaveText(String(after));

    // Coming back to Today again doesn't pay or announce again.
    await page.reload();
    await home.waitUntilReady();
    await expect(home.coinBalance).toHaveText(String(after));
  });
});

test.describe('Explore with reduced motion (P2-16)', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('the layers hold still', async ({ page }) => {
    const save = saveWith([dailyHabit('sleep', 'Sleep')]);
    save.explore.sent = ['2026-10-25'];
    await openWithSave(page, save);
    await new HomePage(page).waitUntilReady();
    const layer = page.getByTestId('explore-layer-near');
    await expect(layer).toBeVisible();
    const t = await layer.evaluate((el) => getComputedStyle(el).transform);
    expect(t === 'none' || t.endsWith(', 0, 0)')).toBe(true);
  });
});
