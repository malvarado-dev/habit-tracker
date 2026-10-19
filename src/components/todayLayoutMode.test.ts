import { describe, expect, it } from '@jest/globals';
import { wideLayout } from '@/design/tokens';
import { layoutMode, wideSizes } from './todayLayoutMode';

describe('Today layout mode (T10)', () => {
  it.each([
    ['Android phone portrait', 412, 915, 'phone'],
    ['phone turned sideways (too short)', 915, 412, 'phone'],
    ['iPad mini portrait', 744, 1133, 'phone'],
    ['iPad mini landscape', 1133, 744, 'wide'],
    ['desktop browser', 1440, 900, 'wide'],
    ['narrow desktop window', 800, 900, 'phone'],
    ['tall wide window', 1000, 1200, 'phone'],
  ] as const)('%s (%i by %i) is %s', (_name, w, h, mode) => {
    expect(layoutMode(w, h)).toBe(mode);
  });
});

describe('wide layout width cap (#51)', () => {
  it('a window under the cap uses its full width (iPad mini landscape looks the same)', () => {
    expect(wideSizes(1133, 744).contentWidth).toBe(1133);
  });

  it('a big monitor stops at the cap, so nothing grows past it', () => {
    const atCap = wideSizes(wideLayout.maxWidth, 900);
    const huge = wideSizes(2000, 900);
    expect(huge.contentWidth).toBe(wideLayout.maxWidth);
    expect(huge.rightWidth).toBe(atCap.rightWidth);
    expect(huge.critterWidth).toBe(atCap.critterWidth);
  });

  it('the critter never passes its own cap', () => {
    expect(wideSizes(2000, 1200).critterWidth).toBeLessThanOrEqual(wideLayout.critterMaxWidth);
  });
});
