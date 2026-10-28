// #141: count edits do not replace Undo for a card that left the current list.
import { toDateKey } from '../../src/rules/dates';
import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { BadHabitsTray } from './pages/BadHabitsTray';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';

const TODAY = toDateKey(FIXED_NOW);
const HABITS = [dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)];
const SODA = { id: 'soda', name: 'Soda' };

test('Today shows Undo only when a frequency card leaves the list', async ({ home }) => {
  await home.tapHabit('water');
  await expect(home.count('water')).toHaveText('1/3');
  await expect(home.undoBar).toBeHidden();
  await home.tapHabit('water');
  await expect(home.undoBar).toBeHidden();
  await home.tapHabit('water');
  await expect(home.card('water')).toBeHidden();
  await expect(home.undoBar).toBeVisible();
  await home.undo();
  await expect(home.count('water')).toHaveText('2/3');
});

test('Today count edits preserve Undo for another removed card', async ({ page }) => {
  await openWithSave(page, saveWith(HABITS, [SODA]));
  const home = new HomePage(page);
  await home.waitUntilReady();
  await home.tapHabit('sleep');
  await home.tapHabit('water');
  await new BadHabitsTray(page).countSlip('soda');
  await expect(page.getByTestId('undo-text')).toHaveText('Sleep logged');
  await home.undo();
  await expect(home.card('sleep')).toBeVisible();
  await expect(home.count('water')).toHaveText('1/3');
  await expect(page.getByTestId('bad-badge-soda')).toHaveText('1');
});

test('History taps stay quiet until a reset removes a card', async ({ page }) => {
  const save = saveWith(HABITS);
  save.log = { [TODAY]: { water: 1 } };
  await openWithSave(page, save, 'history');
  const history = new HistoryPage(page);
  await history.card('water').click();
  await expect(history.count('water')).toHaveText('2/3');
  await expect(history.undoBar).toBeHidden();
  await history.card('water').click();
  await expect(history.count('water')).toHaveText('3/3');
  await expect(history.undoBar).toBeHidden();
  await history.card('water').click();
  await expect(history.card('water')).toHaveCount(0);
  await expect(history.undoBar).toBeVisible();
  await history.undo();
  await expect(history.count('water')).toHaveText('3/3');
});

test('History count edits preserve Undo for another removed card', async ({ page }) => {
  const save = saveWith(HABITS, [SODA]);
  save.log = { [TODAY]: { sleep: 1, water: 1 } };
  save.slips = { [TODAY]: { soda: 1 } };
  await openWithSave(page, save, 'history');
  const history = new HistoryPage(page);
  await history.undoDone('sleep').click();
  await history.card('water').click();
  const tray = new BadHabitsTray(page);
  await tray.countSlip('soda');
  await expect(page.getByTestId('undo-text')).toHaveText('Sleep log removed');
  await history.undo();
  await expect(history.card('sleep')).toBeVisible();
  await expect(history.count('water')).toHaveText('2/3');
  await expect(tray.badge('soda')).toHaveText('2');
});

test('History bad habit popup edits create no Undo, including zero', async ({ page }) => {
  const save = saveWith(HABITS, [SODA]);
  save.slips = { [TODAY]: { soda: 1 } };
  await openWithSave(page, save, 'history');
  const tray = new BadHabitsTray(page);
  await tray.tap('soda');
  await tray.plus.click();
  await tray.minus.click();
  await tray.closeStepper();
  await expect(page.getByTestId('undo-bar')).toBeHidden();
  await tray.tap('soda');
  await tray.minus.click();
  await tray.closeStepper();
  await expect(tray.chip('soda')).toHaveCount(0);
  await expect(page.getByTestId('undo-bar')).toBeHidden();
});

test('History adding a missed habit creates no Undo because it remains visible', async ({
  page,
}) => {
  await openWithSave(page, saveWith(HABITS), 'history');
  const history = new HistoryPage(page);
  await history.missedToggle.click();
  await history.missedList.getByTestId('habit-card-sleep').click();
  await expect(history.card('sleep')).toBeVisible();
  await expect(history.undoBar).toBeHidden();
});

test('History Undo restores a card removed by reversing its linked log', async ({ page }) => {
  const save = saveWith(HABITS, [{ id: 'poor-sleep', name: 'Poor Sleep', pairedWith: 'sleep' }]);
  save.slips = { [TODAY]: { 'poor-sleep': 1 } };
  await openWithSave(page, save, 'history');
  const history = new HistoryPage(page);
  await history.undoDone('sleep').click();
  await expect(history.card('sleep')).toHaveCount(0);
  await expect(history.undoBar).toBeVisible();
  await history.undo();
  await expect(history.card('sleep')).toBeVisible();
});
