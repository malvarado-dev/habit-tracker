// P2-08a end-to-end tests: tap, undo, and ring fill on Today.
// The default save (fixtures.ts) has Sleep (once a day) and Water (3 times a day). Both are due,
// so the possible total is 1 + 3 = 4 logs and the bar is full at 3 (60%, rounded up).
import { expect, test } from './fixtures';

test.describe('logging (P2-08a)', () => {
  test('a tap logs one time, finishes a once-a-day habit, and shows Undo', async ({ home }) => {
    await home.expectBar('Activity Bar, 0 of 3 logs today');

    await home.tapHabit('sleep');

    // Finished cards leave the list (PRD-15). History is where they can be seen again.
    await expect(home.card('sleep')).toHaveCount(0);
    await home.expectBar('Activity Bar, 1 of 3 logs today');
    await expect(home.undoBar).toBeVisible();
    await expect(home.page.getByTestId('undo-text')).toHaveText('Sleep logged');
  });

  test('Undo takes the last log back', async ({ home }) => {
    await home.tapHabit('sleep');
    await home.undo();

    await expect(home.card('sleep')).toBeVisible();
    await expect(home.undoBar).toBeHidden();
    await home.expectBar('Activity Bar, 0 of 3 logs today');
  });

  test('once-a-day habits show no ring or count', async ({ home }) => {
    await expect(home.ring('sleep')).toHaveCount(0);
    await expect(home.count('sleep')).toHaveCount(0);
  });

  test('each log fills one ring segment until the habit is finished', async ({ home }) => {
    await expect(home.count('water')).toHaveText('0/3');
    await expect(home.ring('water')).toHaveAttribute('aria-label', '0 of 3 done today');

    await home.tapHabit('water');
    await home.tapHabit('water');
    await expect(home.count('water')).toHaveText('2/3');
    await expect(home.ring('water')).toHaveAttribute('aria-label', '2 of 3 done today');
    await home.expectBar('Activity Bar, 2 of 3 logs today');

    // The last segment finishes Water, and 3 logs fill the bar.
    await home.tapHabit('water');
    await expect(home.card('water')).toHaveCount(0);
    await home.expectBar('Activity Bar full, 3 of 3 logs today');
  });

  test('Undo on a finished frequency habit brings it back with its ring', async ({ home }) => {
    for (let i = 0; i < 3; i++) await home.tapHabit('water');
    await home.undo();

    await expect(home.card('water')).toBeVisible();
    await expect(home.count('water')).toHaveText('2/3');
  });
});
