// Rendering variants stay separate from the two persistence journeys (#131, #148).
import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

for (const theme of ['light', 'dark'] as const) {
  test(`habit form layout and theme in ${theme} @rendering (#131)`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.addInitScript((value) => localStorage.setItem('habit-tracker/theme', value), theme);
    await openWithSave(page, saveWith([dailyHabit('water', 'Water', 3)]), 'add-habit/details');
    for (const [path, prefix] of [
      ['add-habit/details', 'add'],
      ['habit/water', 'edit'],
    ] as const) {
      await page.goto(path);
      const icon = (await page.getByTestId(`${prefix}-habit-icon`).boundingBox())!;
      const name = (await page.getByTestId(`${prefix}-habit-name`).boundingBox())!;
      expect(icon.x + icon.width).toBeLessThanOrEqual(name.x);
      expect(Math.abs(icon.y + icon.height / 2 - name.y - name.height / 2)).toBeLessThan(2);
      expect(name.x + name.width).toBeLessThanOrEqual(320);
      await expect(page.getByTestId(`${prefix}-times-value`)).toBeVisible();
      for (const kind of ['specificDays', 'anyDays']) {
        await page.getByTestId(`${prefix}-goal-${kind}`).click();
        const summary = (await page.getByTestId(`${prefix}-goal-result`).boundingBox())!;
        const frequency = (await page.getByText('TIMES PER DAY', { exact: true }).boundingBox())!;
        expect(frequency.y).toBeGreaterThanOrEqual(summary.y + summary.height);
        if (kind === 'specificDays') {
          for (let day = 0; day < 7; day++) {
            const box = (await page.getByTestId(`${prefix}-day-${day}`).boundingBox())!;
            expect(box.x + box.width).toBeLessThanOrEqual(320);
          }
          const scan = await new AxeBuilder({ page }).analyze();
          expect(
            scan.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
          ).toEqual([]);
        }
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
    await page.goto('');
    await expect(page.getByTestId('habit-card-water')).toHaveCSS(
      'background-color',
      theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(58, 61, 51)',
    );
  });
}

// Full-app risks: a form edit must reach the save and survive navigation/reload.
test('add and edit frequency, preserving logs and saved color (#131)', async ({ page }) => {
  await openWithSave(page, saveWith([dailyHabit('sleep', 'Sleep')]), 'add-habit/details');
  await page.getByTestId('add-habit-name').fill('Water');
  await expect(page.getByTestId('add-habit-icon')).toHaveText('W');
  await expect(page.getByText('SCHEDULE', { exact: true })).toBeVisible();
  await expect(page.getByText('HABIT COLOR', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('add-times-down')).toBeDisabled();
  await page.getByTestId('add-times-up').click({ clickCount: 2 });
  await expect(page.getByTestId('add-times-value')).toHaveText('3');
  await page.getByTestId('add-habit-confirm').click();
  const id = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('habit-tracker/prototype')!);
    return s.habits.find((h: { name: string }) => h.name === 'Water').id as string;
  });
  await page.goto('');
  await expect(page.getByTestId(`habit-count-${id}`)).toHaveText('0/3');
  await expect(page.getByTestId(`habit-ring-${id}`)).toHaveAttribute(
    'aria-label',
    '0 of 3 done today',
  );
  await page.goto('habits');
  const row = page.getByText('Water', { exact: true });
  await row.click();
  await expect(page.getByTestId('edit-times-value')).toHaveText('3');
  await page.getByTestId('edit-times-up').click({ clickCount: 2 });
  await expect(page.getByTestId('edit-times-value')).toHaveText('5');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem('habit-tracker/prototype')!);
        return s.habits.find((h: { name: string }) => h.name === 'Water')?.timesPerDay;
      }),
    )
    .toBe(5);
  await page.reload();
  await expect(page.getByTestId('edit-times-value')).toHaveText('5');
  for (let i = 5; i < 12; i++) await page.getByTestId('edit-times-up').click();
  await expect(page.getByTestId('edit-times-up')).toBeDisabled();
  await expect(page.getByTestId('edit-times-value')).toHaveText('12');
});

test('lowering frequency keeps logs, color, and the completed card after reload (#131)', async ({
  page,
}) => {
  const habit = { ...dailyHabit('water', 'Water', 5), color: 'habit7' as const };
  const save = saveWith([habit]);
  save.log['2026-10-25'] = { water: 3 };
  await openWithSave(page, save, 'habit/water');
  await page.getByTestId('edit-times-down').click({ clickCount: 3 });
  await expect(page.getByTestId('edit-times-value')).toHaveText('2');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem('habit-tracker/prototype')!);
        return [s.habits[0].timesPerDay, s.habits[0].color, s.log['2026-10-25'].water];
      }),
    )
    .toEqual([2, 'habit7', 3]);
  await page.reload();
  await expect(page.getByTestId('edit-times-value')).toHaveText('2');
  await expect(page.getByText('HABIT COLOR', { exact: true })).toHaveCount(0);
  await page.goto('');
  await expect(page.getByTestId('today-screen')).toBeVisible();
  // Today removes completed cards; the three original logs remain in the save above.
  await expect(page.getByTestId('habit-card-water')).toHaveCount(0);
});
