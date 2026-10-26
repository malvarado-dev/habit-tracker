import { describe, expect, it } from '@jest/globals';

import { tuning } from '@/config/tuning';

import { menuDragOffset, shouldCloseMenu } from './menuSwipe';

const W = 280;

describe('acceptance: swipe the side menu left to close it (T25)', () => {
  it('a drag past a third of the panel closes it', () => {
    expect(shouldCloseMenu(-W / 3 - 1, 0, W)).toBe(true);
    expect(shouldCloseMenu(-W / 3 + 1, 0, W)).toBe(false);
  });

  it('a quick flick left closes it from a short drag', () => {
    expect(shouldCloseMenu(-20, -tuning.menu.swipeCloseVelocity, W)).toBe(true);
    expect(shouldCloseMenu(-20, -tuning.menu.swipeCloseVelocity + 1, W)).toBe(false);
  });

  it('dragging right never closes it, even fast', () => {
    expect(shouldCloseMenu(40, -2000, W)).toBe(false);
    expect(shouldCloseMenu(0, -2000, W)).toBe(false);
  });

  it('the panel follows left only, and never past closed', () => {
    expect(menuDragOffset(-50, W)).toBe(-50);
    expect(menuDragOffset(30, W)).toBe(0);
    expect(menuDragOffset(-999, W)).toBe(-W);
  });
});
