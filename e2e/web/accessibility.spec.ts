// QA-02: automated accessibility scan (axe) on the main screens. Fails on any serious or critical
// problem (the known list from #113 is cleared). The manual pass with a screen reader still happens before release (Test Strategy).
import AxeBuilder from '@axe-core/playwright';

import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';

const SAVE = saveWith(
  [dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)],
  [{ id: 'soda', name: 'Soda' }],
);

for (const [name, path, ready] of [
  ['Today', '', 'today-screen'],
  ['History', 'history', 'history-screen'],
  ['Add habit', 'add-habit', 'pick-habit-screen'],
  ['Test tools', 'test-tools', 'test-tools'],
] as const) {
  test(`${name} has no serious accessibility problems`, async ({ page }) => {
    await openWithSave(page, SAVE, path);
    await expect(page.getByTestId(ready)).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
    expect(serious).toEqual([]);
  });
}
