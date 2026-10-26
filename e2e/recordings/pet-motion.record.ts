// Review recordings for P2-11 (#82). Not a test: `npm run e2e:record` saves phone-size videos of
// the pet's idle, a bounce, and reduced motion to test-results/. Attach them to the PR for review.
import { toDateKey } from '../../src/rules/dates';
import { tuning } from '../../src/config/tuning';
import { dailyHabit, FIXED_NOW, openWithSave, saveWith, test } from '../web/fixtures';
import { HomePage } from '../web/pages/HomePage';
import { TestToolsPage } from '../web/pages/TestToolsPage';

/** How long each recording watches the idle. */
const IDLE_MS = 20000;
// One log today, so the pet is awake (it sleeps until the first log, P2-12).
const SAVE = {
  ...saveWith([dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)]),
  log: { [toDateKey(FIXED_NOW)]: { water: 1 } },
};

test.use({ video: { mode: 'on', size: { width: 412, height: 915 } } });
test.setTimeout(IDLE_MS + 60000);

// Copy each video to test-results/recordings/<test name>.webm, so they're easy to find.
test.afterEach(async ({ page }, info) => {
  const video = page.video();
  await page.close();
  if (!video) return;
  const name = info.titlePath
    .slice(1)
    .join(' - ')
    .replace(/[^\w -]+/g, '');
  await video.saveAs(`test-results/recordings/${name}.webm`);
});

async function idleThenBounce(page: import('@playwright/test').Page) {
  await openWithSave(page, SAVE);
  await new HomePage(page).waitUntilReady();
  await page.waitForTimeout(IDLE_MS);
  await page.goto('test-tools');
  const tools = new TestToolsPage(page);
  await tools.waitUntilReady();
  await tools.bouncePet.click();
  await new HomePage(page).waitUntilReady();
  await page.waitForTimeout(tuning.pet.motion.bounce.testDelayMs + 3000);
}

test('idle, then a bounce', async ({ page }) => {
  await idleThenBounce(page);
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('idle, then a bounce request (no bounce expected)', async ({ page }) => {
    await idleThenBounce(page);
  });
});
