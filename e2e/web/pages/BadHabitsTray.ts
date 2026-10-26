// Page object for the Bad habits tray on Today (P2-09), and Add habit's Bad habits section.
import { expect, type Locator, type Page } from '@playwright/test';

export class BadHabitsTray {
  readonly tray: Locator;
  readonly stepper: Locator;
  readonly stepperCount: Locator;
  readonly plus: Locator;
  readonly minus: Locator;

  constructor(readonly page: Page) {
    this.tray = page.getByTestId('bad-habits-section');
    this.stepper = page.getByTestId('bad-stepper');
    this.stepperCount = page.getByTestId('bad-stepper-count');
    this.plus = page.getByTestId('bad-stepper-plus');
    this.minus = page.getByTestId('bad-stepper-minus');
  }

  chip(id: string): Locator {
    return this.page.getByTestId(`bad-chip-${id}`);
  }

  badge(id: string): Locator {
    return this.page.getByTestId(`bad-badge-${id}`);
  }

  /** One tap counts one slip. */
  async tap(id: string): Promise<void> {
    await this.chip(id).click();
  }

  /** Hold the chip until the stepper opens (the app waits tuning.badHabits.longPressMs). */
  async longPress(id: string): Promise<void> {
    await this.chip(id).click({ delay: 800 });
    await expect(this.stepper).toBeVisible();
  }

  /** Tap outside the stepper to close it. */
  async closeStepper(): Promise<void> {
    await this.page.getByTestId('bad-stepper-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(this.stepper).toBeHidden();
  }
}
