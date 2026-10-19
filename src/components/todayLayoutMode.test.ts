import { describe, expect, it } from '@jest/globals';
import { layoutMode } from './todayLayoutMode';

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
