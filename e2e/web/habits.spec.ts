// QA-02: add, edit and remove a habit, end to end (the core setup flow).
import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import { HomePage } from './pages/HomePage';

const HABITS = [dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)];

test.describe('habits (QA-02)', () => {
  test('a habit you create shows on Today', async ({ page }) => {
    await openWithSave(page, saveWith(HABITS), 'habits');
    await page.getByTestId('habits-add').click();
    await page.getByTestId('pick-habit-create').click();
    await page.getByTestId('add-habit-name').fill('Walk the dog');
    await page.getByTestId('add-habit-confirm').click();
    await expect(page.getByTestId('habits-screen')).toBeVisible();

    await page.getByTestId('habits-back').click();
    await new HomePage(page).waitUntilReady();
    await expect(page.getByText('Walk the dog')).toBeVisible();
  });

  test('renaming a habit changes it on Today', async ({ page }) => {
    await openWithSave(page, saveWith(HABITS), 'habits');
    await page.getByTestId('habits-row-sleep').click();
    await page.getByTestId('edit-habit-name').fill('Sleep early');
    await page.getByTestId('edit-habit-back').click();
    await page.getByTestId('habits-back').click();

    const home = new HomePage(page);
    await home.waitUntilReady();
    await expect(page.getByTestId('habit-name-sleep')).toHaveText('Sleep early');
  });

  test('removing a habit takes it off Today, and Undo brings it back', async ({ page }) => {
    await openWithSave(page, saveWith(HABITS), 'habits');
    await page.getByTestId('habits-row-sleep').click();
    await page.getByTestId('edit-habit-remove').click();
    await expect(page.getByTestId('habits-undo-bar')).toBeVisible();
    await expect(page.getByTestId('habits-row-sleep')).toHaveCount(0);

    await page.getByTestId('habits-undo').click();
    await expect(page.getByTestId('habits-row-sleep')).toBeVisible();
  });
});
