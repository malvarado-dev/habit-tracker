import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { HistoryPage } from './pages/HistoryPage';
import { toDateKey } from '../../src/rules/dates';

const TODAY = toDateKey(FIXED_NOW);
const HABITS = [dailyHabit('water', 'Drink Water', 3), dailyHabit('sleep', 'Sleep')];

// Full-app risk: reset/Undo must reach the persisted save and restore after reload.
test('History frequency card taps increment, reset, Undo and survive reload (#146)', async ({
  page,
}) => {
  const save = saveWith(HABITS);
  save.log = { [TODAY]: { water: 1, sleep: 1 } };
  await openWithSave(page, save, 'history');
  const history = new HistoryPage(page);
  await expect(page.getByTestId('history-plus-water')).toHaveCount(0);
  await expect(page.getByTestId('history-minus-water')).toHaveCount(0);
  await history.card('water').click();
  await expect(history.count('water')).toHaveText('2/3');
  await expect(history.undoBar).toBeHidden();
  await history.card('water').click();
  await expect(history.count('water')).toHaveText('3/3');
  await history.card('water').click();
  await expect(history.card('water')).toHaveCount(0);
  await history.undo();
  await expect(history.count('water')).toHaveText('3/3');
  await page.reload();
  await expect(history.count('water')).toHaveText('3/3');
  await history.card('sleep').click();
  await expect(history.card('sleep')).toBeVisible();
  await expect(history.undoDone('sleep')).toBeVisible();
});

// Full-app risk: a mixed reset must persist good logs and linked slips independently.
test('History reset retains linked slips and creates no toast while the card remains (#146)', async ({
  page,
}) => {
  const save = saveWith(HABITS, [{ id: 'spill', name: 'Spill', pairedWith: 'water' }]);
  save.log = { [TODAY]: { water: 2 } };
  save.slips = { [TODAY]: { spill: 1 } };
  await openWithSave(page, save, 'history');
  const history = new HistoryPage(page);
  await history.card('water').click();
  await expect(history.count('water')).toHaveText('1/3');
  await expect(page.getByTestId('bad-badge-spill')).toHaveText('1');
  await expect(history.undoBar).toBeHidden();
  await page.reload();
  await expect(history.count('water')).toHaveText('1/3');
  await expect(page.getByTestId('bad-badge-spill')).toHaveText('1');
});

// Full-app risk: mode routing and storage keys must isolate Real from Test through reload.
test('Test History reset and Undo leave Real logs unchanged (#146)', async ({ page }) => {
  const save = saveWith(HABITS);
  save.log = { [TODAY]: { water: 3 } };
  await page.addInitScript((state) => {
    if (sessionStorage.getItem('cycle-test-seeded')) return;
    localStorage.setItem('habit-tracker/prototype-test', JSON.stringify(state));
    sessionStorage.setItem('cycle-test-seeded', '1');
  }, save);
  await openWithSave(page, save, 'test-tools');
  await page.getByTestId('mode-test').click();
  await page.goto('history');
  const history = new HistoryPage(page);
  await history.card('water').click();
  await expect(history.card('water')).toHaveCount(0);
  await history.undo();
  await expect(history.count('water')).toHaveText('3/3');
  await history.card('water').click();
  await expect(history.card('water')).toHaveCount(0);
  await page.reload();
  await expect(history.card('water')).toHaveCount(0);
  await page.goto('test-tools');
  await page.getByTestId('mode-real').click();
  await page.goto('history');
  await expect(history.count('water')).toHaveText('3/3');
});
