// P2-08b end-to-end tests: slide reveal (option D), Skip, linked bad habit chip, long-press menu.
// Eat Healthy (3 times a day) is paired with Eat Out; Read (once a day) has no link. Both are due,
// so the possible total is 3 + 1 = 4 logs and the bar is full at 3.
import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import { HomePage } from './pages/HomePage';

const HABITS = [dailyHabit('eat', 'Eat Healthy', 3), dailyHabit('read', 'Read')];
const BAD = [{ id: 'eat-out', name: 'Eat Out', pairedWith: 'eat' }];

async function open(page: import('@playwright/test').Page): Promise<HomePage> {
  await openWithSave(page, saveWith(HABITS, BAD));
  const home = new HomePage(page);
  await home.waitUntilReady();
  return home;
}

test.describe('slide actions (P2-08b)', () => {
  test('sliding a linked habit reveals Skip first, then its bad habit chip', async ({ page }) => {
    const home = await open(page);
    await home.slideOpen('eat');

    await expect(home.slideSkip('eat')).toBeVisible();
    await expect(home.slideSlip('eat')).toHaveAttribute('aria-label', 'Log Eat Out, 0 today');
    // Skip sits to the left of the chip, so it never moves.
    const skip = await home.slideSkip('eat').boundingBox();
    const chip = await home.slideSlip('eat').boundingBox();
    expect(skip!.x).toBeLessThan(chip!.x);
  });

  test('a habit with no link reveals Skip only', async ({ page }) => {
    const home = await open(page);
    await home.slideOpen('read');
    await expect(home.slideSlip('read')).toHaveCount(0);
  });

  test('tapping the chip logs a slip that fills a slate segment and moves the bar', async ({
    page,
  }) => {
    const home = await open(page);
    await home.slideOpen('eat');
    await home.slideSlip('eat').click();

    await expect(home.count('eat')).toHaveText('1/3');
    await expect(home.ring('eat')).toHaveAttribute('aria-label', '1 of 3 done today');
    await expect(page.getByTestId('undo-text')).toHaveText('Eat Out counted');
    await home.expectBar('Activity Bar, 1 of 3 logs today');

    await home.undo();
    await expect(home.count('eat')).toHaveText('0/3');
  });

  test('Skip hides the card for today, leaves the bar alone, and Undo brings it back', async ({
    page,
  }) => {
    const home = await open(page);
    await home.slideOpen('read');
    await home.slideSkip('read').click();

    await expect(home.card('read')).toHaveCount(0);
    await expect(page.getByTestId('undo-text')).toHaveText('Read skipped today');
    await home.expectBar('Activity Bar, 0 of 3 logs today');

    await home.undo();
    await expect(home.card('read')).toBeVisible();
  });

  test('long-press opens the menu: Log Eat Out, Skip today, Edit habit', async ({ page }) => {
    const home = await open(page);
    await home.openMenu('eat');

    await expect(home.menuItem('slip')).toHaveText('Log Eat Out');
    await expect(home.menuItem('skip')).toBeVisible();
    await expect(home.menuItem('edit')).toBeVisible();

    await home.menuItem('slip').click();
    await expect(page.getByTestId('card-menu')).toBeHidden();
    await expect(home.count('eat')).toHaveText('1/3');
  });
});
