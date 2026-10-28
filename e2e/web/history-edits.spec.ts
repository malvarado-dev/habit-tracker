// P2-18b end-to-end tests: editing a day in History (#108). The fixed clock is Sun Oct 25, 2026;
// today and the 2 days before can change. Water (3 a day) and Stretch are due every day.
import { addDays, toDateKey } from '../../src/rules/dates';
import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { BadHabitsTray } from './pages/BadHabitsTray';
import { HistoryPage } from './pages/HistoryPage';

const TODAY = toDateKey(FIXED_NOW);
const back = (n: number) => addDays(TODAY, -n);

function save() {
  const s = saveWith(
    [dailyHabit('water', 'Water', 3), dailyHabit('stretch', 'Stretch')],
    [{ id: 'soda', name: 'Soda' }],
  );
  s.log = { [TODAY]: { stretch: 1 }, [back(1)]: { water: 1 }, [back(3)]: { water: 1 } };
  s.slips = { [back(1)]: { soda: 1 } };
  return s;
}

async function openOn(page: import('@playwright/test').Page, date: string) {
  await openWithSave(page, save(), 'history');
  const history = new HistoryPage(page);
  await history.waitUntilReady();
  await history.selectDay(date);
  return history;
}

test.describe('History edits (P2-18b)', () => {
  test('− and + change a past day; only removing the final log shows Undo', async ({ page }) => {
    const history = await openOn(page, back(1));
    await history.plus('water').click();
    await expect(history.count('water')).toHaveText('2/3');
    await expect(history.undoBar).toBeHidden();
    await history.minus('water').click();
    await expect(history.count('water')).toHaveText('1/3');
    await expect(history.undoBar).toBeHidden();
    await history.minus('water').click();
    await expect(history.loggedCard('water')).toHaveCount(0);
    await history.undo();
    await expect(history.count('water')).toHaveText('1/3');
  });

  test('Undo on a Done habit takes it off the day, and the Undo bar brings it back', async ({
    page,
  }) => {
    const history = await openOn(page, TODAY);
    await history.undoDone('stretch').click();
    await expect(history.loggedCard('stretch')).toHaveCount(0);
    await history.undo();
    await expect(history.loggedCard('stretch')).toBeVisible();
  });

  test('a tap on a slip opens the stepper; at 0 the chip leaves once it closes', async ({
    page,
  }) => {
    await openOn(page, back(1));
    const tray = new BadHabitsTray(page);
    await tray.chip('soda').click();
    await expect(tray.stepper).toBeVisible();
    await tray.minus.click();
    await expect(tray.badge('soda')).toHaveText('0');
    await expect(tray.chip('soda')).toBeVisible();
    await tray.closeStepper();
    await expect(tray.chip('soda')).toHaveCount(0);
  });

  test('a missed habit logs with one tap and moves up into the day', async ({ page }) => {
    const history = await openOn(page, back(1));
    await history.missedToggle.click();
    await history.missedList.getByTestId('habit-card-stretch').click();
    await expect(history.missedList.getByTestId('habit-card-stretch')).toHaveCount(0);
    await expect(history.count('stretch')).toHaveText('Done');
  });

  test('filling a past day adds it to the band and the streak', async ({ page }) => {
    const history = await openOn(page, back(1));
    await expect(history.band(back(1))).toHaveCount(0);
    await history.plus('water').click();
    await history.plus('water').click();
    await history.missedToggle.click();
    await history.missedList.getByTestId('habit-card-stretch').click();
    await expect(history.band(back(1))).toBeVisible();
    await expect(history.streak).toHaveText('1 day streak · Best 1');
  });

  test('a locked day has no edit controls', async ({ page }) => {
    const history = await openOn(page, back(3));
    await expect(history.dayStatus).toHaveText('Locked in');
    await expect(history.plus('water')).toHaveCount(0);
    await expect(history.missedToggle).toHaveCount(0);
  });
});
