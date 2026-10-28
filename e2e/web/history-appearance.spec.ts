import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { HistoryPage } from './pages/HistoryPage';
import { toDateKey } from '../../src/rules/dates';

const TODAY = toDateKey(FIXED_NOW);
function save() {
  const state = saveWith(
    [dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)],
    [{ id: 'poor-sleep', name: 'Poor Sleep', pairedWith: 'sleep' }],
  );
  state.log = { [TODAY]: { sleep: 1, water: 2 } };
  return state;
}

for (const theme of ['light', 'dark'] as const) {
  test(`History controls and completed names in ${theme} (#146)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 320, height: 850 });
    await openWithSave(page, save(), 'history');
    const history = new HistoryPage(page);
    const name = (id: string) => page.getByTestId(`habit-name-${id}`);
    await expect(name('sleep')).toHaveCSS('text-decoration-line', 'line-through');
    await expect(page.getByTestId('habit-strike-sleep')).toHaveCount(0);
    await expect(page.getByTestId('habit-check-sleep')).toHaveCount(0);
    await expect(name('sleep')).toHaveAccessibleName('Sleep, completed');
    await expect(history.card('sleep').getByText('Done', { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('habit-strike-water')).toHaveCount(0);
    await expect(page.getByTestId('habit-check-water')).toHaveCount(0);
    await expect(name('water')).toHaveCSS('text-decoration-line', 'none');
    const nameWeight = await name('water').evaluate((el) => getComputedStyle(el).fontWeight);
    await expect(name('water')).toHaveAccessibleName('Water, in progress');
    await expect(history.count('water')).toHaveText('2/3');
    const status = await history.dayStatus.boundingBox();
    expect(status!.x).toBeGreaterThanOrEqual(0);
    expect(status!.x + status!.width).toBeLessThanOrEqual(320);
    await expect(page.getByTestId('history-plus-water')).toHaveCount(0);
    await expect(page.getByTestId('history-minus-water')).toHaveCount(0);
    const card = await history.card('water').boundingBox();
    expect(card!.height).toBeGreaterThanOrEqual(44);
    expect(card!.x + card!.width).toBeLessThanOrEqual(320);
    await history.card('water').click();
    await expect(name('water')).toHaveCSS('text-decoration-line', 'line-through');
    await expect(page.getByTestId('habit-strike-water')).toHaveCount(0);
    await expect(page.getByTestId('habit-check-water')).toHaveCount(0);
    await expect(name('water')).toHaveCSS('font-weight', nameWeight);
    await expect(history.count('water')).toHaveText('3/3');
    await expect(history.undoBar).toBeHidden();
    await history.card('water').click();
    await expect(history.card('water')).toHaveCount(0);
    await history.undo();
    await expect(history.count('water')).toHaveText('3/3');
    await expect(history.undoDone('sleep').locator('svg')).toBeVisible();
    await history.undoDone('sleep').click();
    await expect(history.card('sleep')).toHaveCount(0);
    await history.undo();
    await expect(name('sleep')).toHaveCSS('text-decoration-line', 'line-through');
  });

  test(`long names retain the same space when completed in ${theme} (#146)`, async ({ page }) => {
    const state = save();
    state.habits[1]!.name = 'Drink Water at Night';
    state.log[TODAY]!.water = 2;
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 320, height: 850 });
    await openWithSave(page, state, 'history');
    const name = page.getByTestId('habit-name-water');
    await expect(name).toHaveCSS('text-decoration-line', 'none');
    await expect(page.getByTestId('habit-check-water')).toHaveCount(0);
    await expect(page.getByTestId('habit-strike-water')).toHaveCount(0);
    const textBox = await name.boundingBox();
    const countBox = await page.getByTestId('habit-count-water').boundingBox();
    expect(textBox!.x + textBox!.width).toBeLessThanOrEqual(countBox!.x);
    await expect(page.getByTestId('habit-count-water')).toHaveText('2/3');
    await page.getByTestId('habit-card-water').click();
    await expect(name).toHaveCSS('text-decoration-line', 'line-through');
    const completedBox = await name.boundingBox();
    expect(Math.abs(completedBox!.width - textBox!.width)).toBeLessThan(1);
    await expect(name).toHaveText('Drink Water at Night');
  });

  test(`continuous streak bands across the reported joins in ${theme} (#146)`, async ({ page }) => {
    const state = saveWith([dailyHabit('sleep', 'Sleep')]);
    const days = [18, 19, 21, 22, 23, 24, 26, 27];
    state.log = Object.fromEntries(days.map((d) => [`2026-10-${d}`, { sleep: 1 }]));
    await page.emulateMedia({ colorScheme: theme });
    await openWithSave(page, state, 'history');
    await page.clock.setFixedTime(new Date('2026-10-27T09:00:00'));
    await page.reload();
    for (const width of [320, 393]) {
      await page.setViewportSize({ width, height: 850 });
      const runs = page.locator('[data-testid^="history-band-run-"]');
      await expect(runs).toHaveCount(3);
      for (const [start, end] of [
        [21, 24],
        [26, 27],
      ]) {
        const band = page.getByTestId(`history-band-run-2026-10-${start}`);
        await expect(band).toBeVisible();
        const shape = await band.boundingBox();
        const first = await page.getByTestId(`history-day-2026-10-${start}`).boundingBox();
        const last = await page.getByTestId(`history-day-2026-10-${end}`).boundingBox();
        expect(shape!.x).toBeGreaterThan(first!.x);
        expect(shape!.x + shape!.width).toBeLessThan(last!.x + last!.width);
        expect(shape!.x + shape!.width).toBeGreaterThan(last!.x);
        await expect(band).toHaveCSS('border-top-left-radius', '999px');
      }
      await expect(page.getByTestId('history-band-2026-10-20')).toHaveCount(0);
      await expect(page.getByTestId('history-band-2026-10-25')).toHaveCount(0);
    }
  });
}

test('History countdown refreshes from hours to minutes and locks at midnight (#146)', async ({
  page,
}) => {
  await page.clock.install({ time: FIXED_NOW });
  await openWithSave(page, save(), 'history');
  await page.clock.setFixedTime(new Date('2026-10-25T23:00:00'));
  await page.reload();
  const history = new HistoryPage(page);
  await history.selectDay('2026-10-23');
  await expect(history.dayStatus).toHaveText('1 hour left to edit');
  await page.clock.setFixedTime(new Date('2026-10-25T23:01:00'));
  await page.clock.fastForward(60_000);
  await expect(history.dayStatus).toHaveText('59 minutes left to edit');
  await page.clock.setFixedTime(new Date('2026-10-25T23:59:00'));
  await page.clock.fastForward(60_000);
  await expect(history.dayStatus).toHaveText('1 minute left to edit');
  await page.clock.setFixedTime(new Date('2026-10-26T00:00:00'));
  await page.clock.fastForward(60_000);
  await expect(history.dayStatus).toHaveText('Locked in');
});
