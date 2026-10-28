// P2-12 end-to-end tests: where the pet is and whether it's awake (#83, PRD-09). Before the
// first habit log it sleeps in the bed, or hides behind it under Confidence 10. The first log
// wakes it and it moves to its Confidence spot. Slips don't wake it.
import { tuning } from '../../src/config/tuning';
import { dailyHabit, expect, openWithSave, saveWith, test } from './fixtures';
import { BadHabitsTray } from './pages/BadHabitsTray';
import { HomePage } from './pages/HomePage';
import { TestToolsPage } from './pages/TestToolsPage';

const HABITS = [dailyHabit('sleep', 'Sleep'), dailyHabit('water', 'Water', 3)];

/**
 * Opens Today on a save with this Confidence and nothing logged. Logging raises Confidence too
 * (P2-13): with these habits the first Sleep log adds +7 (habit +2, first notch +5).
 */
async function openAt(page: import('@playwright/test').Page, confidence: number) {
  const save = saveWith(HABITS, [{ id: 'soda', name: 'Soda' }]);
  save.pet.confidenceAdjust = confidence - tuning.pet.stats.startConfidence;
  await openWithSave(page, save);
  const home = new HomePage(page);
  await home.waitUntilReady();
  return home;
}

test.describe('Pet spots and wake rule (P2-12)', () => {
  test('asleep in the bed before the first log, then wakes onto the bed at Confidence 12', async ({
    page,
  }) => {
    const home = await openAt(page, 12);
    expect(await home.petPlace()).toEqual({ spot: 'bed', layer: 'inBed' });
    expect(await home.petDrawOrder()).toBe('inBed');

    await home.tapHabit('sleep');
    await expect.poll(() => home.petPlace()).toEqual({ spot: 'bedAwake', layer: 'inBed' });
  });

  test('a slip does not wake it', async ({ page }) => {
    const home = await openAt(page, 20);
    await new BadHabitsTray(page).countSlip('soda');
    expect(await home.petPlace()).toEqual({ spot: 'bed', layer: 'inBed' });
  });

  test('undoing the only log puts it back to sleep', async ({ page }) => {
    const home = await openAt(page, 12);
    await home.tapHabit('sleep');
    await expect.poll(() => home.petPlace()).toEqual({ spot: 'bedAwake', layer: 'inBed' });
    await home.undo();
    await expect.poll(() => home.petPlace()).toEqual({ spot: 'bed', layer: 'inBed' });
  });

  test('above Confidence 25 it moves to the middle of the room, in front of the bed', async ({
    page,
  }) => {
    const home = await openAt(page, 30);
    await home.tapHabit('sleep');
    await expect.poll(() => home.petPlace()).toEqual({ spot: 'room', layer: 'front' });
    expect(await home.petDrawOrder()).toBe('front');
  });

  test('under Confidence 10 it hides behind the bed, before and after a log', async ({ page }) => {
    const home = await openAt(page, 0);
    expect(await home.petPlace()).toEqual({ spot: 'hide', layer: 'behindBed' });
    expect(await home.petDrawOrder()).toBe('behindBed');
    await home.tapHabit('sleep');
    await expect.poll(() => home.petPlace()).toEqual({ spot: 'hide', layer: 'behindBed' });
  });

  test('the Test tools Confidence stepper moves the pet between spots', async ({ page }) => {
    await openWithSave(page, saveWith(HABITS), 'test-tools');
    const tools = new TestToolsPage(page);
    await tools.waitUntilReady();
    await tools.useTestData();
    await expect(tools.confidence()).toHaveText('20');
    await tools.stepConfidence(-2);
    await expect(tools.confidence()).toHaveText('0');
    await tools.back.click();
    const home = new HomePage(page);
    await home.waitUntilReady();
    expect(await home.petPlace()).toEqual({ spot: 'hide', layer: 'behindBed' });
  });
});
