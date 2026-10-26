// Living room layout on the two test devices (P2-06, #77): the room fills the width, the window
// sits just under the status bar, and the bed and pet stay clear of the status bar, menu and sheet.

import { describe, expect, it } from '@jest/globals';
import { tuning } from '@/config/tuning';
import { space } from '@/theme';
import { petGeometry, roomGeometry, shiftOf, type PetSpot } from './roomGeometry';

const DEVICES = [
  { name: 'Android phone (small)', width: 360, height: 800, statusBar: 24 },
  { name: 'Android phone (large)', width: 412, height: 915, statusBar: 48 },
  { name: 'iPad mini portrait', width: 744, height: 1133, statusBar: 24 },
];
const SPOTS = Object.keys(tuning.scene.pet.spots) as PetSpot[];
const MENU = { left: space.lg, size: 44 };

describe.each(DEVICES)('$name', ({ width, height, statusBar }) => {
  const g = roomGeometry(width, height, statusBar);
  const menuBottom = statusBar + space.sm + MENU.size;

  it('the room fills the width and reaches past the top of the sheet', () => {
    expect(g.room.left).toBe(0);
    expect(g.room.width).toBe(width);
    expect(g.room.top).toBeLessThanOrEqual(0);
    expect(g.room.top + g.room.height).toBeGreaterThan(g.sheetTop + 28);
  });

  it('the window glass sits just under the status bar', () => {
    const glassTop = tuning.scene.windowGlass.y * g.scale + g.room.top;
    expect(glassTop).toBeCloseTo(statusBar + tuning.scene.windowGapBelowStatusBar, 5);
  });

  it('the bed is below the status bar and clear of the sheet', () => {
    expect(g.bed.top).toBeGreaterThan(statusBar);
    expect(g.bed.top + g.bed.height).toBeLessThanOrEqual(
      g.sheetTop - tuning.scene.sceneClearOfSheet,
    );
  });

  it.each(SPOTS)('the pet at the %s spot is clear of the status bar, menu and sheet', (spot) => {
    const pet = petGeometry(spot, { scale: g.scale, shift: shiftOf(g) });
    const { left, top, width: w, height: h } = pet.image;
    expect(top).toBeGreaterThan(statusBar);
    const besideMenu = left > MENU.left + MENU.size;
    expect(besideMenu || top > menuBottom).toBe(true);
    expect(top + h).toBeLessThanOrEqual(g.sheetTop - tuning.scene.sceneClearOfSheet);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(left + w).toBeLessThanOrEqual(width);
  });

  it('the sheet never starts above its usual height', () => {
    expect(g.sheetTop).toBeGreaterThanOrEqual(Math.round(height * tuning.scene.sheetTopRatio));
  });
});

describe('Room never changes with the theme', () => {
  it('room layout takes no theme input', () => {
    // Only screen size and status bar go in; nothing from the theme can move or recolor the room.
    expect(roomGeometry.length).toBeGreaterThanOrEqual(3);
    expect(roomGeometry(390, 844, 47)).toEqual(roomGeometry(390, 844, 47));
  });
});

describe('Menu button over the room', () => {
  // WCAG relative luminance and contrast.
  const lum = ([r, g, b]: number[]) => {
    const c = [r, g, b].map((v) => {
      const s = (v ?? 0) / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (c[0] ?? 0) + 0.7152 * (c[1] ?? 0) + 0.0722 * (c[2] ?? 0);
  };
  const contrast = (a: number[], b: number[]) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
  };
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r, gr, b, a] = tuning.scene.menuButton.match(/[\d.]+/g)!.map(Number);

  // The door frame behind the button, sampled from room-base.png (darkest and lightest wood).
  it.each([
    [130, 81, 47],
    [181, 130, 90],
  ])('icon has at least 3:1 contrast on wall color %i,%i,%i', (...wall) => {
    const under = wall.map((w, i) => w * (1 - (a ?? 0)) + ([r, gr, b][i] ?? 0) * (a ?? 0));
    expect(contrast(hex(tuning.scene.menuInk), under)).toBeGreaterThanOrEqual(3);
  });
});
