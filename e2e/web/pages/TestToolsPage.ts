// Page object for the Test tools screen (prototype only). Only the parts P2-10 and P2-11 tests use.
import { expect, type Locator, type Page } from '@playwright/test';

export type Design = 'design1' | 'design2';

export class TestToolsPage {
  readonly back: Locator;
  /** Goes back to Today and plays one pet bounce (P2-11). */
  readonly bouncePet: Locator;

  constructor(readonly page: Page) {
    this.back = page.getByTestId('test-tools-back');
    this.bouncePet = page.getByTestId('pet-bounce-button');
  }

  designChip(design: Design): Locator {
    return this.page.getByTestId(`bad-habit-${design}`);
  }

  async waitUntilReady(): Promise<void> {
    await expect(this.page.getByTestId('test-tools')).toBeVisible();
  }

  /** Picks a bad habits layout and checks it's the one selected. */
  async pickDesign(design: Design): Promise<void> {
    await this.designChip(design).click();
    await expect(this.designChip(design)).toHaveAttribute('aria-checked', 'true');
  }
}
