// Page object for Today (Test Architecture: "Page objects"). Tests say what they do, like
// home.tapHabit('water'), and only this file knows the test IDs. If the screen changes, the fix
// goes here once instead of in every test.
import { expect, type Locator, type Page } from '@playwright/test';

export class HomePage {
  readonly activityBar: Locator;
  readonly undoBar: Locator;
  readonly undoButton: Locator;
  /** The Coin bar's balance (P2-08c). It counts up as coins land, so assert with toHaveText. */
  readonly coinBalance: Locator;
  /** The moving pet's body (P2-11), and the pet art inside it. */
  readonly petBody: Locator;
  readonly petImage: Locator;

  constructor(readonly page: Page) {
    this.activityBar = page.getByTestId('activity-bar');
    this.undoBar = page.getByTestId('undo-bar');
    this.undoButton = page.getByTestId('undo-button');
    this.coinBalance = page.getByTestId('coin-balance');
    this.petBody = page.getByTestId('pet-body');
    this.petImage = page.getByTestId('pet-image');
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
  /** Home without the sheet (#133): the Today row (Today pill and Activity Bar) and the list. */
  todayRow(): Locator {
    return this.page.getByTestId('today-row');
  }

  /** Scrolls the habit list to its end, the way a finger would drag it up. */
  async scrollListToEnd(): Promise<void> {
    await this.page.getByTestId('habit-list').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
  }

  /** Top and bottom of an element on screen, in points. */
  async edges(target: Locator): Promise<{ top: number; bottom: number }> {
    const box = await target.boundingBox();
    if (!box) throw new Error('Not on screen');
    return { top: box.y, bottom: box.y + box.height };
  }

  async expectBar(label: string): Promise<void> {
    await expect(this.activityBar).toHaveAttribute('aria-label', label);
  }

  /** How far the pet is off the floor right now, in points (0 when not hopping). */
  async petHop(): Promise<number> {
    return this.petBody.evaluate((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return -m.m42;
    });
  }

  /** Starts counting blinks. A blink is too quick to catch by polling, so the page counts each
   * time the pet's eyes close. */
  async watchBlinks(): Promise<void> {
    await this.page.evaluate(() => {
      const w = window as unknown as { petBlinks: number };
      w.petBlinks = 0;
      new MutationObserver((changes) => {
        for (const c of changes) {
          if ((c.target as Element).id === 'pet-eyes-closed') w.petBlinks++;
        }
      }).observe(document.body, { attributes: true, attributeFilter: ['id'], subtree: true });
    });
  }

  /** Blinks counted since watchBlinks(). */
  async blinkCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { petBlinks: number }).petBlinks);
  }

  /** The pet's spot and bed layer, e.g. 'bed' and 'inBed' (P2-12). */
  async petPlace(): Promise<{ spot: string; layer: string }> {
    const id = (await this.page.getByTestId('pet-layer').getAttribute('id')) ?? '';
    const [, spot = '', layer = ''] = /^pet-at-(\w+)-(\w+)$/.exec(id) ?? [];
    return { spot, layer };
  }

  /** Where the pet is drawn against the bed: before its back layer, between, or after the front. */
  async petDrawOrder(): Promise<'behindBed' | 'inBed' | 'front'> {
    return this.page.evaluate(() => {
      const get = (id: string) => document.querySelector(`[data-testid="${id}"]`)!;
      const pet = get('pet-layer');
      const before = (a: Element, b: Element) =>
        !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      if (before(pet, get('bed-back'))) return 'behindBed';
      if (before(pet, get('bed-front'))) return 'inBed';
      return 'front';
    });
  }
}
