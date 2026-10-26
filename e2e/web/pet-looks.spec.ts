// P2-15a end-to-end test: the pet look picker (#122). The overlay fit is judged from the screenshot
// sheet (TESTING.md: feel is manual); the risk covered here is the choice not saving.
import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import { HomePage } from './pages/HomePage';
import { TestToolsPage } from './pages/TestToolsPage';

test.describe('Pet looks (P2-15a)', () => {
  test('picking Tabby-Gray changes the pet on Today, and it stays after a reload', async ({
    page,
  }) => {
    await openWithSave(page, saveWith([dailyHabit('sleep', 'Sleep')]), 'test-tools');
    const tools = new TestToolsPage(page);
    await tools.waitUntilReady();
    await tools.pickPetLook('tabbyGray');

    await tools.back.click();
    const home = new HomePage(page);
    await home.waitUntilReady();
    await expect(page.locator('#pet-look-tabbyGray')).toBeVisible();

    await page.reload();
    await home.waitUntilReady();
    await expect(page.locator('#pet-look-tabbyGray')).toBeVisible();
  });
});
