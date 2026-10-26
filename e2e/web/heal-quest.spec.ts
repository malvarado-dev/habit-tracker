// P2-15 end-to-end test: the Heal Neko quest (#86). The counting rules are unit tested
// (quest.test.ts); this covers the journey and that progress survives a reload (TESTING.md rule 5).
import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import { HomePage } from './pages/HomePage';
import { TestToolsPage } from './pages/TestToolsPage';

test.describe('Heal Neko quest (P2-15)', () => {
  test('accept, check in, claim, and the bandages come off', async ({ page }) => {
    await openWithSave(page, saveWith([dailyHabit('sleep', 'Sleep')]));
    const home = new HomePage(page);
    await home.waitUntilReady();
    const card = page.getByTestId('main-quest-card');
    const progress = page.getByTestId('main-quest-progress');

    // Before Accept: New quest, and the pet is bandaged.
    await expect(progress).toHaveText('New quest');
    await expect(page.getByTestId('pet-bandages')).toBeAttached();

    // Accept, then fill today's bar: 1 check-in day, still there after a reload.
    await card.click();
    await page.getByTestId('quest-accept').click();
    await expect(progress).toHaveText('0/7 Check in days');
    await home.tapHabit('sleep');
    await expect(progress).toHaveText('1/7 Check in days');
    await page.reload();
    await home.waitUntilReady();
    await expect(progress).toHaveText('1/7 Check in days');

    // Jump to 7 in Test tools (Test save), then claim on Today.
    await page.goto('test-tools');
    const tools = new TestToolsPage(page);
    await tools.waitUntilReady();
    await tools.useTestData();
    await page.getByTestId('heal-check-ins-up').click();
    for (let i = 0; i < 6; i++) await page.getByTestId('heal-check-ins-up').click();
    await expect(page.getByTestId('heal-check-ins-value')).toHaveText('7');
    await tools.back.click();
    await home.waitUntilReady();
    await expect(page.getByTestId('main-quest-claim')).toBeVisible();
    await card.click();
    await expect(page.getByTestId('moment-caption')).toContainText('Neko is all healed.');
    await expect(card).toHaveCount(0);
    await expect(page.getByTestId('pet-bandages')).toHaveCount(0);
  });
});
