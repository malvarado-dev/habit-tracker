// P2-11 end-to-end tests: the pet's idle motion (#82). Blinks on its own, bounces when Test tools
// asks, and with reduced motion keeps blinking but never bounces.
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

  test('the pet blinks on its own', async ({ page }) => {
    const home = await openAwake(page);
    await home.watchBlinks();
    await expect.poll(() => home.blinkCount(), { timeout: BLINK_WAIT }).toBeGreaterThan(0);
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

  test.describe('with reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('keeps blinking but never bounces', async ({ page }) => {
      const home = await bounceFromTestTools(page);
      await home.watchBlinks();
      // Sample the hop through the whole window a bounce would use.
      const samples: number[] = [];
      const end = Date.now() + BOUNCE_WAIT;
      while (Date.now() < end) {
        samples.push(await home.petHop());
        await page.waitForTimeout(30);
      }
      expect(Math.max(...samples)).toBeLessThan(0.5);
      await expect.poll(() => home.blinkCount(), { timeout: BLINK_WAIT }).toBeGreaterThan(0);
    });
  });
});
