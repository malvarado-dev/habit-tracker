// Living room layout on the test devices (P2-06, #77; no sheet since #133): the room fills the
// screen, the window sits just under the top bar, the bed and pet show in full above the Today row
// at rest, and the Today row sticks under the top bar once scrolled.

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
  const topBarBottom = statusBar + space.sm + MENU.size;
  const clear = tuning.scene.sceneClearOfList;

  it('the room and the wall above it fill the width and reach past the Today row', () => {
    expect(g.room.left).toBe(0);
    expect(g.room.width).toBe(width);
    // Nothing above the room art is left empty: the wall fills any gap.
    expect(g.wallGap).toBeCloseTo(Math.max(0, g.room.top), 5);
    expect(g.room.top + g.room.height).toBeGreaterThan(g.listTop + tuning.scene.todayRowHeight);
  });

  it('the window glass sits just under the top bar (Menu button and quest pill)', () => {
    expect(g.topBarBottom).toBe(topBarBottom);
    const glassTop = tuning.scene.windowGlass.y * g.scale + g.room.top;
    expect(glassTop).toBeCloseTo(topBarBottom + tuning.scene.windowGapBelowTopBar, 5);
  });

  it('at rest, the bed shows in full below the top bar and above the Today row', () => {
    expect(g.bed.top).toBeGreaterThan(topBarBottom);
    expect(g.bed.top + g.bed.height).toBeLessThanOrEqual(g.listTop - clear);
  });

  it.each(SPOTS)('at rest, the pet at the %s spot shows in full', (spot) => {
    const pet = petGeometry(spot, { scale: g.scale, shift: shiftOf(g) });
    const { left, top, width: w, height: h } = pet.image;
    expect(top).toBeGreaterThan(topBarBottom);
    expect(top + h).toBeLessThanOrEqual(g.listTop - clear);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(left + w).toBeLessThanOrEqual(width);
  });

  it('once scrolled, the Today row sticks just under the top bar, above where it rests', () => {
    expect(g.stuckTop).toBe(topBarBottom + space.sm);
    expect(g.stuckTop).toBeLessThan(g.listTop);
  });
});

describe('Short screens', () => {
  it('the Today row never starts lower than its cap, so cards still show', () => {
    const g = roomGeometry(360, 560, 24);
    expect(g.listTop).toBeLessThanOrEqual(Math.round(560 * tuning.scene.listTopMaxRatio));
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

  // What can sit behind the button, sampled from room-base.png: the darkest and lightest door
  // frame wood, and the wall bands stretched above the art (#133).
  it.each([[130, 81, 47], [181, 130, 90], ...tuning.scene.wallTop.map((band) => hex(band.color))])(
    'icon has at least 3:1 contrast on wall color %i,%i,%i',
    (...wall) => {
      const under = wall.map((w, i) => w * (1 - (a ?? 0)) + ([r, gr, b][i] ?? 0) * (a ?? 0));
      expect(contrast(hex(tuning.scene.menuInk), under)).toBeGreaterThanOrEqual(3);
    },
  );
});
