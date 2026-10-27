// #133 end-to-end tests: Home without the sheet. The room fills the screen, the pet shows in full
// above the Today row at rest, and once the list scrolls, the Today row sticks under the top bar
// while cards still log. Ten habits make a list longer than the screen; two make a short one.
import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import { HomePage } from './pages/HomePage';

const HABITS = Array.from({ length: 10 }, (_, i) => dailyHabit(`h${i + 1}`, `Habit ${i + 1}`));

test.describe('Home without the sheet (#133)', () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    await openWithSave(page, saveWith(HABITS));
    home = new HomePage(page);
    await home.waitUntilReady();
  });

  test('at rest, the pet shows in full above the Today row', async () => {
    const pet = await home.edges(home.petImage);
    const row = await home.edges(home.todayRow());
    expect(pet.bottom).toBeLessThanOrEqual(row.top);
  });

  test('after scrolling, the Today row sticks under the top bar and stays visible', async () => {
    const atRest = await home.edges(home.todayRow());
    await home.scrollListToEnd();

    const menu = await home.edges(home.page.getByTestId('menu-button'));
    await expect(async () => {
      const stuck = await home.edges(home.todayRow());
      expect(stuck.top).toBeLessThan(atRest.top);
      expect(stuck.top).toBeGreaterThanOrEqual(menu.bottom);
      expect(stuck.top).toBeLessThan(menu.bottom + 16);
    }).toPass();
    await expect(home.todayRow()).toBeVisible();
    await expect(home.activityBar).toBeVisible();
    await expect(home.page.getByTestId('today-strip')).toHaveCSS('opacity', '1');
  });

  test('a card scrolled up from below still logs', async () => {
    await home.scrollListToEnd();
    await expect(home.card('h10')).toBeInViewport();

    await home.tapHabit('h10');

    await expect(home.card('h10')).toHaveCount(0);
    await expect(home.page.getByTestId('undo-text')).toHaveText('Habit 10 logged');
  });
});

test('a short list still scrolls far enough for the Today row to stick (#133)', async ({
  page,
}) => {
  await openWithSave(page, saveWith(HABITS.slice(0, 2)));
  const home = new HomePage(page);
  await home.waitUntilReady();
  await home.scrollListToEnd();

  const menu = await home.edges(page.getByTestId('menu-button'));
  await expect(async () => {
    const stuck = await home.edges(home.todayRow());
    expect(stuck.top).toBeGreaterThanOrEqual(menu.bottom);
    expect(stuck.top).toBeLessThan(menu.bottom + 16);
  }).toPass();
});
