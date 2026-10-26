// P2-08c end-to-end tests: logs earn Coins, shown in the Coin bar, and Undo takes them back.
// Default habits from fixtures: Sleep once a day, Water 3 times a day. 1 Coin per log.
import { expect, openWithSave, saveWith, dailyHabit, test } from './fixtures';
import { BadHabitsTray } from './pages/BadHabitsTray';
import { HomePage } from './pages/HomePage';

test.describe('Coins from logs (P2-08c)', () => {
  test('a log earns a Coin and the balance counts up', async ({ home }) => {
    await expect(home.coinBalance).toHaveText('0');
    await home.tapHabit('sleep');
    await expect(home.coinBalance).toHaveText('1');
    await home.tapHabit('water');
    await home.tapHabit('water');
    await expect(home.coinBalance).toHaveText('3');
  });

  test('Undo takes the Coin back', async ({ home }) => {
    await home.tapHabit('sleep');
    await expect(home.coinBalance).toHaveText('1');
    await home.undo();
    await expect(home.coinBalance).toHaveText('0');
  });

  test('a standalone bad habit earns no Coins', async ({ page }) => {
    await openWithSave(
      page,
      saveWith([dailyHabit('sleep', 'Sleep')], [{ id: 'soda', name: 'Soda' }]),
    );
    const home = new HomePage(page);
    const tray = new BadHabitsTray(page);
    await home.waitUntilReady();
    await tray.tap('soda');
    await expect(tray.badge('soda')).toHaveText('1');
    await expect(home.coinBalance).toHaveText('0');
  });

  test('the Coin bar never blocks a habit tap', async ({ home }) => {
    await home.tapHabit('water');
    // The bar is on screen now; the next taps still land.
    await home.tapHabit('water');
    await home.tapHabit('sleep');
    await expect(home.coinBalance).toHaveText('3');
  });
});
