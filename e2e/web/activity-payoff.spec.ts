// P2-14 end-to-end tests: the Activity Bar payoff (#85). Animation timing is unit tested
// (payoff.test.ts) and judged in recordings (TESTING.md, rule 4). The risk covered here is AC 3:
// a moment never blocks habit taps, and logs made during one still save.
import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import { HomePage } from './pages/HomePage';

// Three once-a-day habits: the bar fills at 2 logs (60% of 3, rounded up).
const HABITS = [
  dailyHabit('sleep', 'Sleep'),
  dailyHabit('read', 'Read'),
  dailyHabit('walk', 'Walk'),
];

test.describe('Activity Bar payoff (P2-14)', () => {
  test('a full bar plays a moment, and a log during it still saves', async ({ page }) => {
    await openWithSave(page, saveWith(HABITS));
    const home = new HomePage(page);
    await home.waitUntilReady();

    await home.tapHabit('sleep');
    await home.tapHabit('read');
    // The moment starts: its caption says what you did.
    await expect(page.getByTestId('moment-caption')).toContainText('You finished 2 habits.');

    // Log during the moment: the tap works and the log saves.
    await home.tapHabit('walk');
    await expect(home.card('walk')).toHaveCount(0);
    await page.reload();
    await home.waitUntilReady();
    await expect(home.card('walk')).toHaveCount(0);
  });
});
