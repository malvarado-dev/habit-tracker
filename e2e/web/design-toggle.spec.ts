// P2-10 end-to-end tests: the Design 1 / Design 2 switch in Test tools (PRD-15 Playtest plan).
// Water is 3 times a day, so Design 1 shows its ring; Poor Sleep is a mirror bad habit, so
// Design 2 hides it. Each test flips the switch on the Test tools screen, then checks Today.
import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import { BadHabitsTray } from './pages/BadHabitsTray';
import { HomePage } from './pages/HomePage';
import { TestToolsPage } from './pages/TestToolsPage';

const HABITS = [dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)];
const BAD = [
  { id: 'soda', name: 'Soda' },
  { id: 'bad-poor-sleep-1', name: 'Poor Sleep' },
];

async function openInDesign(page: import('@playwright/test').Page, design: 'design1' | 'design2') {
  await openWithSave(page, saveWith(HABITS, BAD), 'test-tools');
  const tools = new TestToolsPage(page);
  await tools.waitUntilReady();
  await tools.pickDesign(design);
  await tools.back.click();
  const home = new HomePage(page);
  await home.waitUntilReady();
  return home;
}

test.describe('Design 1 / Design 2 switch (P2-10)', () => {
  test('Design 1 keeps the frequency ring and shows every bad habit', async ({ page }) => {
    const home = await openInDesign(page, 'design1');
    const tray = new BadHabitsTray(page);
    await expect(home.ring('water')).toBeVisible();
    await expect(home.count('water')).toHaveText('0/3');
    await expect(tray.chip('bad-poor-sleep-1')).toBeVisible();
  });

  test('Design 2: no ring, one tap finishes a frequency habit', async ({ page }) => {
    const home = await openInDesign(page, 'design2');
    await expect(home.ring('water')).toHaveCount(0);
    await home.tapHabit('water');
    await expect(home.card('water')).toBeHidden();
  });

  test('Design 2 hides mirror bad habits and keeps the others', async ({ page }) => {
    await openInDesign(page, 'design2');
    const tray = new BadHabitsTray(page);
    await expect(tray.chip('soda')).toBeVisible();
    await expect(tray.chip('bad-poor-sleep-1')).toHaveCount(0);
  });

  test('switching back to Design 1 shows the same logs with the ring again', async ({ page }) => {
    const home = await openInDesign(page, 'design1');
    await home.tapHabit('water');
    await expect(home.count('water')).toHaveText('1/3');

    await page.goto('test-tools');
    const tools = new TestToolsPage(page);
    await tools.pickDesign('design2');
    await tools.back.click();
    await expect(home.card('water')).toBeHidden();

    await page.goto('test-tools');
    await tools.pickDesign('design1');
    await tools.back.click();
    await expect(home.count('water')).toHaveText('1/3');
  });

  test('the chosen design is saved on the device', async ({ page }) => {
    await openInDesign(page, 'design2');
    await page.reload();
    await page.goto('test-tools');
    await expect(new TestToolsPage(page).designChip('design2')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
