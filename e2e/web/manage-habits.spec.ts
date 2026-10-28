import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import { TestToolsPage } from './pages/TestToolsPage';
import AxeBuilder from '@axe-core/playwright';

const HABITS = [dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)];
const BAD = [
  { id: 'soda', name: 'Soda' },
  { id: 'bad-poor-sleep-1', name: 'Poor Sleep', pairedWith: 'sleep' },
];

for (const theme of ['light', 'dark'] as const) {
  test(`management screens fit a small phone and expose accessible controls in ${theme} (#132)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.addInitScript((value) => localStorage.setItem('habit-tracker/theme', value), theme);
    await openWithSave(page, saveWith(HABITS, BAD), 'habits');
    for (const path of ['habits', 'bad-habit/soda']) {
      await page.goto(path);
      await expect(
        page.getByRole('heading', {
          name: path === 'habits' ? 'Manage habits' : 'Edit bad habit',
          exact: true,
        }),
      ).toBeVisible();
      const builder = new AxeBuilder({ page });
      // The new box and new editor are this ticket's accessibility scope.
      if (path === 'habits') builder.include('[data-testid="habits-bad-box"]');
      const scan = await builder.analyze();
      expect(
        scan.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
      ).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
  });
}

test('add a bad habit, then edit its name and pairing and reload (#132)', async ({ page }) => {
  await openWithSave(page, saveWith(HABITS), 'habits');
  await expect(page.getByRole('heading', { name: 'Manage habits', exact: true })).toBeVisible();
  await expect(page).toHaveTitle('Manage habits · Habit Tracker');
  await expect(page.getByTestId('habits-bad-box')).toHaveCount(0);
  await expect(page.getByTestId('habits-row-water')).toContainText('Every day, 3x per day');
  await expect(page.getByTestId('habits-row-sleep')).not.toContainText('1x per day');
  await page.getByTestId('habits-add').click();
  await expect(
    page.getByText(
      "Track your slips and we'll show you your improvement over time. No game penalties.",
    ),
  ).toBeVisible();
  await expect(page.getByTestId('pick-habit-back')).toHaveText('‹ Manage habits');
  await page.getByTestId('pick-bad-soda').click();
  await expect(
    page.getByText(
      'If it gets in the way of a good habit, pair them. For example, pair Eat Out with Eat Healthy to track cheat meals.',
    ),
  ).toBeVisible();
  await page.getByTestId('add-bad-confirm').click();
  const chip = page.getByTestId('habits-bad-box').getByRole('button');
  await expect(chip).toHaveText('Soda On its own');
  await chip.click();
  await page.getByTestId('edit-bad-name').fill('Soft drinks');
  await page.getByTestId('edit-bad-pair-water').click();
  await page.getByTestId('edit-bad-back').click();
  await expect(chip).toContainText('Paired with Water');
  await page.reload();
  await expect(chip).toHaveText('Soft drinks Paired with Water');
  await chip.click();
  await page.getByTestId('edit-bad-name').fill('Sleep');
  await expect(page.getByTestId('edit-bad-name-hint')).toContainText('already have');
  await page.getByTestId('edit-bad-back').click();
  await expect(chip).toContainText('Soft drinks');
  await chip.click();
  await page.getByTestId('edit-bad-pair-none').click();
  await page.getByTestId('edit-bad-back').click();
  await page.goto('');
  await expect(page.getByTestId('bad-habits-section')).toContainText('Soft drinks');
});

test('remove and Undo keep the position, pairing and slips after reload (#132)', async ({
  page,
}) => {
  const save = saveWith(HABITS, BAD);
  save.slips = { '2026-10-25': { soda: 2 }, '2026-10-24': { soda: 1 } };
  await openWithSave(page, save, 'habits');
  await page.getByTestId('habits-bad-soda').click();
  await page.getByTestId('edit-bad-remove').click();
  await expect(page.getByTestId('habits-bad-soda')).toHaveCount(0);
  await page.getByTestId('habits-undo').click();
  await expect(page.getByTestId('habits-bad-box').getByRole('button').first()).toContainText(
    'Soda',
  );
  await page.reload();
  await page.goto('');
  await expect(page.getByTestId('bad-badge-soda')).toHaveText('2');
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('habit-tracker/prototype')!),
  );
  expect(stored.slips).toEqual(save.slips);
  expect(stored.badHabits).toEqual(BAD);
  await page.goto('habits');
  await page.getByTestId('habits-bad-soda').click();
  await page.getByTestId('edit-bad-remove').click();
  await page.goto('');
  await expect(page.getByTestId('bad-chip-soda')).toHaveCount(0);
});

test('a removed partner becomes On its own; removing the final bad habit hides the box (#132)', async ({
  page,
}) => {
  await openWithSave(page, saveWith(HABITS, [BAD[1]!]), 'habits');
  await page.getByTestId('habits-row-sleep').click();
  await page.getByTestId('edit-habit-remove').click();
  await expect(page.getByTestId('habits-bad-bad-poor-sleep-1')).toContainText('On its own');
  await page.getByTestId('habits-bad-bad-poor-sleep-1').click();
  await expect(page.getByTestId('edit-bad-pair-none')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('edit-bad-remove').click();
  await expect(page.getByTestId('habits-bad-box')).toHaveCount(0);
  await page.getByTestId('habits-undo').click();
  await expect(page.getByTestId('habits-bad-box')).toContainText('Poor Sleep');
});

test('Design 2 manages hidden habits and saved frequency without clearing pairing (#132)', async ({
  page,
}) => {
  await openWithSave(page, saveWith(HABITS, BAD), 'test-tools');
  const tools = new TestToolsPage(page);
  await tools.pickDesign('design2');
  await page.goto('habits');
  await expect(page.getByTestId('habits-row-water')).toContainText('3x per day');
  await expect(page.getByTestId('habits-bad-bad-poor-sleep-1')).toContainText('Paired with Sleep');
  await page.getByTestId('habits-bad-bad-poor-sleep-1').click();
  await expect(page.getByRole('radiogroup', { name: 'Pair with' })).toHaveCount(0);
  await page.getByTestId('edit-bad-name').fill('Restless sleep');
  await page.getByTestId('edit-bad-back').click();
  await expect(page).toHaveURL(/\/habits$/);
  await expect(page.getByTestId('habits-bad-bad-poor-sleep-1')).toContainText('Restless sleep');
  await page.reload();
  await expect(page.getByTestId('habits-bad-bad-poor-sleep-1')).toHaveText(
    'Restless sleep Paired with Sleep',
  );
  await page.goto('test-tools');
  await tools.pickDesign('design1');
  await page.goto('habits');
  await page.getByTestId('habits-bad-bad-poor-sleep-1').click();
  await expect(page.getByTestId('edit-bad-pair-sleep')).toHaveAttribute('aria-checked', 'true');
  await page.goto('habit/water');
  await expect(page.getByTestId('edit-times-value')).toHaveText('3');
});

test('more than 15 bad habits can be added while the good-habit limit stays separate (#132)', async ({
  page,
}) => {
  const bad = Array.from({ length: 15 }, (_, i) => ({ id: `bad-${i}`, name: `Bad ${i}` }));
  await openWithSave(page, saveWith(HABITS, bad), 'habits');
  await expect(page.getByTestId('habits-add')).toBeEnabled();
  await page.getByTestId('habits-add').click();
  await page.getByTestId('pick-bad-soda').click();
  await expect(page.getByTestId('add-bad-confirm')).toBeEnabled();
  await page.getByTestId('add-bad-confirm').click();
  await expect(page).toHaveURL(/\/habits$/);
  await page.reload();
  await expect(page.getByTestId('habits-bad-box').getByRole('button')).toHaveCount(16);
});

test('15 good habits disable Add habit even with bad habits present (#132)', async ({ page }) => {
  await openWithSave(
    page,
    saveWith(
      Array.from({ length: 15 }, (_, i) => dailyHabit(`good-${i}`, `Good ${i}`)),
      BAD,
    ),
    'habits',
  );
  await expect(page.getByTestId('habits-add')).toBeDisabled();
  await expect(page.getByTestId('habits-bad-box').getByRole('button')).toHaveCount(2);
});

test('Test edits and Undo never change the Real save (#132)', async ({ page }) => {
  const real = saveWith(HABITS, BAD);
  await page.addInitScript((save) => {
    if (!sessionStorage.getItem('test-seeded')) {
      localStorage.setItem('habit-tracker/prototype-test', JSON.stringify(save));
      sessionStorage.setItem('test-seeded', '1');
    }
  }, real);
  await openWithSave(page, real, 'test-tools');
  await new TestToolsPage(page).useTestData();
  await page.goto('habits');
  await page.getByTestId('habits-bad-soda').click();
  await page.getByTestId('edit-bad-name').fill('Test drinks');
  await page.getByTestId('edit-bad-remove').click();
  await page.getByTestId('habits-undo').click();
  await expect(page.getByTestId('habits-bad-soda')).toContainText('Test drinks');
  await page.reload();
  await expect(page.getByTestId('habits-bad-soda')).toContainText('Test drinks');
  await page.goto('test-tools');
  await page.getByTestId('mode-real').click();
  await page.goto('habits');
  await expect(page.getByTestId('habits-bad-soda')).toHaveText('Soda On its own');
  await expect(page.getByTestId('habits-undo')).toHaveCount(0);
});
