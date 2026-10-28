// Focused web rendering checks (#146), not E2E journeys or native visual verification.
// Seed the screen directly. Theme variants cover appearance, not duplicate count behavior.
import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { toDateKey } from '../../src/rules/dates';
import { tuning } from '../../src/config/tuning';

const TODAY = toDateKey(FIXED_NOW);

for (const theme of ['light', 'dark'] as const) {
  test(`History card rendering in ${theme} @rendering (#146)`, async ({ page }) => {
    const state = saveWith(
      [
        dailyHabit('partial', 'Drink Water at Night', 3),
        dailyHabit('complete', 'Drink Water at Night', 3),
        dailyHabit('sleep', 'Sleep'),
      ],
      [{ id: 'poor-sleep', name: 'Poor Sleep', pairedWith: 'sleep' }],
    );
    state.log = { [TODAY]: { partial: 2, complete: 3 } };
    state.slips = { [TODAY]: { 'poor-sleep': 1 } };
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 320, height: 850 });
    await openWithSave(page, state, 'history');
    const partial = page.getByTestId('habit-name-partial');
    const complete = page.getByTestId('habit-name-complete');
    await expect(partial).toHaveCSS('text-decoration-line', 'none');
    await expect(complete).toHaveCSS('text-decoration-line', 'line-through');
    const before = await partial.boundingBox();
    const after = await complete.boundingBox();
    expect(Math.abs(before!.width - after!.width)).toBeLessThan(1);
    for (const id of ['partial', 'complete']) {
      const card = await page.getByTestId(`habit-card-${id}`).boundingBox();
      const name = await page.getByTestId(`habit-name-${id}`).boundingBox();
      const counter = await page.getByTestId(`habit-count-${id}`).boundingBox();
      expect(card!.height).toBeGreaterThanOrEqual(44);
      expect(card!.x + card!.width).toBeLessThanOrEqual(320);
      expect(name!.x + name!.width).toBeLessThanOrEqual(counter!.x);
      await expect(page.getByTestId(`habit-check-${id}`)).toHaveCount(0);
      await expect(page.getByTestId(`habit-strike-${id}`)).toHaveCount(0);
    }
    await expect(page.getByTestId('history-undo-sleep').locator('svg')).toBeVisible();
    await expect(
      page
        .getByTestId('habit-ring-sleep')
        .locator(`path[stroke="${tuning.ring.slate}"][stroke-dasharray]`),
    ).toHaveCount(1);
  });

  test(`History calendar joins in ${theme} @rendering (#146)`, async ({ page }) => {
    const state = saveWith([dailyHabit('sleep', 'Sleep')]);
    state.log = Object.fromEntries(
      [18, 19, 21, 22, 23, 24, 26, 27].map((d) => [`2026-10-${d}`, { sleep: 1 }]),
    );
    await page.emulateMedia({ colorScheme: theme });
    await openWithSave(page, state, 'history');
    await page.clock.setFixedTime(new Date('2026-10-27T09:00:00'));
    await page.reload();
    for (const width of [320, 393]) {
      await page.setViewportSize({ width, height: 850 });
      await expect(page.locator('[data-testid^="history-band-run-"]')).toHaveCount(3);
      for (const [start, end] of [
        [21, 24],
        [26, 27],
      ]) {
        const band = page.getByTestId(`history-band-run-2026-10-${start}`);
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
