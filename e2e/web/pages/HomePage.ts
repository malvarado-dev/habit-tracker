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

  /** The Activity Bar's screen reader label, like "Activity Bar, 1 of 3 logs today". */
  async expectBar(label: string): Promise<void> {
    await expect(this.activityBar).toHaveAttribute('aria-label', label);
  }
}
