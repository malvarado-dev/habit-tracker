// Page object for History (P2-18a, P2-18b day edits). Tests say history.selectDay(date); only this file knows the IDs.
import { expect, type Locator, type Page } from '@playwright/test';

export class HistoryPage {
  readonly month: Locator;
  readonly streak: Locator;
  readonly prev: Locator;
  readonly next: Locator;
  readonly dayTitle: Locator;
  readonly dayStatus: Locator;
  readonly empty: Locator;

  constructor(readonly page: Page) {
    this.month = page.getByTestId('history-month').first();
    this.streak = page.getByTestId('history-streak').first();
    this.prev = page.getByTestId('history-prev-month').first();
    this.next = page.getByTestId('history-next-month').first();
    this.dayTitle = page.getByTestId('history-day-title').first();
    this.dayStatus = page.getByTestId('history-day-status').first();
    this.empty = page.getByTestId('history-day-empty').first();
  }

  async waitUntilReady(): Promise<void> {
    await expect(this.page.getByTestId('history-view').first()).toBeVisible();
  }

  day(date: string): Locator {
    return this.page.getByTestId(`history-day-${date}`).first();
  }

  band(date: string): Locator {
    return this.page.getByTestId(`history-band-${date}`).first();
  }

  card(habitId: string): Locator {
    return this.page.getByTestId(`habit-card-${habitId}`);
  }

  slipChip(badHabitId: string): Locator {
    return this.page.getByTestId(`bad-chip-${badHabitId}`);
  }

  async selectDay(date: string): Promise<void> {
    await this.day(date).click();
  }

  count(habitId: string): Locator {
    return this.page.getByTestId(`habit-count-${habitId}`).first();
  }

  undoDone(habitId: string): Locator {
    return this.page.getByTestId(`history-undo-${habitId}`);
  }

  get missedToggle(): Locator {
    return this.page.getByTestId('history-missed-toggle');
  }

  get missedList(): Locator {
    return this.page.getByTestId('history-missed-list');
  }

  /** A habit in the day's logged list (not the missed list). */
  loggedCard(habitId: string): Locator {
    return this.page
      .getByTestId('history-day-details')
      .getByTestId(`habit-card-${habitId}`)
      .first();
  }

  get undoBar(): Locator {
    return this.page.getByTestId('undo-bar');
  }

  async undo(): Promise<void> {
    await this.page.getByTestId('undo-button').click();
  }
}
