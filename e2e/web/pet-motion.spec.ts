// P2-11 end-to-end tests: the pet's idle motion (#82). The art fills its spot, and Test tools
// can bounce it. Blink and breath timing are unit tested (petMotion.test.ts) and judged in
// recordings, not waited on here (TESTING.md, rule 4).
import { toDateKey } from '../../src/rules/dates';
import { tuning } from '../../src/config/tuning';
import { dailyHabit, expect, FIXED_NOW, openWithSave, saveWith, test } from './fixtures';
import { HomePage } from './pages/HomePage';
import { TestToolsPage } from './pages/TestToolsPage';

const m = tuning.pet.motion;
/** Longest wait before a blink, plus room for the page to settle. */
const BLINK_WAIT = m.blink.gapMaxMs * m.personality.idleTiming + 3000;
/** Long enough for the delay and the whole hop. */
const BOUNCE_WAIT = m.bounce.testDelayMs + m.bounce.anticipationMs + m.bounce.riseMs + 2000;

/** A save with one log today, so the pet is awake (it sleeps until the first log, P2-12). */
function awakeSave() {
  const save = saveWith([dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)]);
  const today = toDateKey(FIXED_NOW);
  save.log = { [today]: { water: 1 } };
  return save;
}

/** Opens Today with the pet awake. */
async function openAwake(page: import('@playwright/test').Page): Promise<HomePage> {
  await openWithSave(page, awakeSave());
  const home = new HomePage(page);
  await home.waitUntilReady();
  return home;
}

/** Opens Test tools, taps Bounce the pet, and lands back on Today. */
async function bounceFromTestTools(page: import('@playwright/test').Page): Promise<HomePage> {
  await openWithSave(page, awakeSave(), 'test-tools');
  const tools = new TestToolsPage(page);
  await tools.waitUntilReady();
  await tools.bouncePet.click();
  const home = new HomePage(page);
  await home.waitUntilReady();
  return home;
}

test.describe('Pet idle motion (P2-11)', () => {
  test('the pet art fills its spot in the room', async ({ page }) => {
    const home = await openAwake(page);
    const body = await home.petBody.boundingBox();
    const art = await home.petImage.boundingBox();
    expect(body && art).toBeTruthy();
    expect(Math.abs(art!.width - body!.width)).toBeLessThan(2);
    expect(Math.abs(art!.height - body!.height)).toBeLessThan(2);
  });

  test('Bounce the pet in Test tools makes the pet hop', async ({ page }) => {
    const home = await bounceFromTestTools(page);
    // The hop is short, so sample often.
    await expect
      .poll(() => home.petHop(), { timeout: BOUNCE_WAIT, intervals: [30] })
      .toBeGreaterThan(1);
    // ...and it lands again.
    await expect.poll(() => home.petHop(), { timeout: BOUNCE_WAIT }).toBeLessThan(0.5);
  });
});
