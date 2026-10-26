// P2-13 end-to-end tests: Love and Confidence come from the log (#84). Unit tests cover the math
// (petStats.test.ts); these cover the user data risks (TESTING.md rule 5): stats survive a reload,
// and Real logs never change the Test pet.
import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import { HomePage } from './pages/HomePage';
import { TestToolsPage } from './pages/TestToolsPage';

const HABITS = [dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)];

test.describe('Pet stats (P2-13)', () => {
  test('a log raises Confidence, it holds after a reload, and the Test pet is untouched', async ({
    page,
  }) => {
    // Confidence 20 (start). The first Sleep log adds +7, past 25, so the pet moves to the room.
    await openWithSave(page, saveWith(HABITS));
    const home = new HomePage(page);
    await home.waitUntilReady();
    await home.tapHabit('sleep');
    await expect.poll(() => home.petPlace()).toEqual({ spot: 'room', layer: 'front' });

    await page.reload();
    await home.waitUntilReady();
    expect(await home.petPlace()).toEqual({ spot: 'room', layer: 'front' });

    await page.goto('test-tools');
    const tools = new TestToolsPage(page);
    await tools.waitUntilReady();
    await tools.useTestData();
    await expect(tools.confidence()).toHaveText('20');
    await expect(tools.love()).toHaveText('20');
  });
});
