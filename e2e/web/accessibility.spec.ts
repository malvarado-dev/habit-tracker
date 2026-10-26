// QA-02: automated accessibility scan (axe) on the main screens. Fails on serious and critical
// problems not on the known list. The manual pass with a screen reader still happens before release (Test Strategy).
import AxeBuilder from '@axe-core/playwright';

import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';

/** Known problems, tracked in #113. The scan fails on anything not listed here. Remove each one
 * as it's fixed; the list should end up empty. */
const KNOWN: Record<string, string[]> = {
  Today: ['document-title', 'aria-required-attr', 'label-content-name-mismatch'],
  History: ['document-title'],
  'Add habit': ['document-title', 'label-content-name-mismatch'],
  'Test tools': ['document-title', 'aria-required-attr'],
};

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
      .filter((v) => !KNOWN[name]!.includes(v.id))
      .map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
    expect(serious).toEqual([]);
  });
}
