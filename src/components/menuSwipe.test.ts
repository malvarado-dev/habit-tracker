/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

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

  const menu = readFileSync(join(__dirname, 'SideMenu.tsx'), 'utf8');

  it('the swipe covers the panel and the shade', () => {
    expect(menu).toContain('<GestureDetector gesture={swipe}>');
    expect(menu.indexOf('<GestureDetector')).toBeLessThan(menu.indexOf('testID="side-menu-shade"'));
  });

  it('mostly vertical drags never close it', () => {
    expect(menu).toContain('failOffsetY');
  });

  it('there is no edge swipe to open', () => {
    const today = readFileSync(join(__dirname, '../app/index.tsx'), 'utf8');
    expect(today).not.toMatch(/usePanGesture|GestureDetector/);
  });

  it('swipe values live in the tuning file', () => {
    expect(menu).not.toMatch(/activeOffsetX: \[?-?\d/);
  });
});
