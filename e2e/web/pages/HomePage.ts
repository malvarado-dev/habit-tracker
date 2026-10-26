// Page object for Today (Test Architecture: "Page objects"). Tests say what they do, like
// home.tapHabit('water'), and only this file knows the test IDs. If the screen changes, the fix
// goes here once instead of in every test.
import { expect, type Locator, type Page } from '@playwright/test';

export class HomePage {
  readonly activityBar: Locator;
  readonly undoBar: Locator;
  readonly undoButton: Locator;

  constructor(readonly page: Page) {
    this.activityBar = page.getByTestId('activity-bar');
    this.undoBar = page.getByTestId('undo-bar');
    this.undoButton = page.getByTestId('undo-button');
  }

  /** The app has loaded its save and drawn the habit sheet. */
  async waitUntilReady(): Promise<void> {
    await expect(this.page.getByTestId('today-screen')).toBeVisible();
    await expect(this.activityBar).toBeVisible();
  }

  card(habitId: string): Locator {
    return this.page.getByTestId(`habit-card-${habitId}`);
  }

  ring(habitId: string): Locator {
    return this.page.getByTestId(`habit-ring-${habitId}`);
  }

  count(habitId: string): Locator {
    return this.page.getByTestId(`habit-count-${habitId}`);
  }

  /** One tap on a habit card logs it one time. */
  async tapHabit(habitId: string): Promise<void> {
    await this.card(habitId).click();
  }

  async undo(): Promise<void> {
    await this.undoButton.click();
  }

  /** Slide a card right to reveal Skip and its linked bad habit (P2-08b). */
  async slideOpen(habitId: string): Promise<void> {
    const box = await this.card(habitId).boundingBox();
    if (!box) throw new Error(`No card for ${habitId}`);
    const y = box.y + box.height / 2;
    await this.page.mouse.move(box.x + 24, y);
    await this.page.mouse.down();
    // Small steps, like a finger, so the slide wins over a scroll.
    await this.page.mouse.move(box.x + 24 + 220, y, { steps: 12 });
    await this.page.mouse.up();
    await expect(this.page.getByTestId(`habit-skip-${habitId}`)).toBeVisible();
  }

  slideSkip(habitId: string): Locator {
    return this.page.getByTestId(`habit-skip-${habitId}`);
  }

  slideSlip(habitId: string): Locator {
    return this.page.getByTestId(`habit-slip-${habitId}`);
  }

  /** Hold a card until its menu opens (Log [bad habit], Skip today, Edit habit). */
  async openMenu(habitId: string): Promise<void> {
    await this.card(habitId).click({ delay: 800 });
    await expect(this.page.getByTestId('card-menu')).toBeVisible();
  }

  menuItem(name: 'slip' | 'skip' | 'edit'): Locator {
    return this.page.getByTestId(`card-menu-${name}`);
  }

  /** The Activity Bar's screen reader label, like "Activity Bar, 1 of 3 logs today". */
  async expectBar(label: string): Promise<void> {
    await expect(this.activityBar).toHaveAttribute('aria-label', label);
  }
}
