import { describe, expect, it } from '@jest/globals';
import { background, critter, spendioDark, spendioLight, type ThemeColors } from '../tokens';
import {
  contrastRatio,
  withAlpha,
  loadThemePreference,
  resolveScheme,
  saveThemePreference,
  themeColors,
  type PreferenceStorage,
} from './theme';

function fakeStorage(): PreferenceStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
  };
}

describe('Theme setting', () => {
  it.each([
    ['system', 'dark', 'dark'],
    ['system', 'light', 'light'],
    ['system', null, 'light'],
    ['light', 'dark', 'light'],
    ['dark', 'light', 'dark'],
  ] as const)('%s with the phone on %s shows %s', (preference, phone, expected) => {
    expect(resolveScheme(preference, phone)).toBe(expected);
  });

  it('defaults to Match phone on first launch', async () => {
    expect(await loadThemePreference(fakeStorage())).toBe('system');
  });

  it('the saved choice is still set after a restart', async () => {
    const storage = fakeStorage();
    await saveThemePreference(storage, 'dark');
    expect(await loadThemePreference(storage)).toBe('dark');
  });

  it('a broken or junk save falls back to Match phone', async () => {
    const junk = fakeStorage();
    junk.data.set('habit-tracker/theme', 'purple');
    expect(await loadThemePreference(junk)).toBe('system');
    const broken: PreferenceStorage = {
      getItem: () => Promise.reject(new Error('disk')),
      setItem: () => Promise.reject(new Error('disk')),
    };
    expect(await loadThemePreference(broken)).toBe('system');
    await expect(saveThemePreference(broken, 'light')).resolves.toBeUndefined();
  });
});

describe('acceptance: a theme changes only the sheet, cards, text, and Energy bar', () => {
  it('light and dark have exactly the same token names', () => {
    expect(Object.keys(themeColors('dark')).sort()).toEqual(Object.keys(spendioLight).sort());
  });

  it('theme tokens never include a sky or critter color name', () => {
    const themeKeys = Object.keys(spendioLight);
    for (const key of [...Object.keys(background), ...Object.keys(critter)]) {
      expect(themeKeys).not.toContain(key);
    }
  });

  it('the critter and Background are separate sets that the theme cannot reach', () => {
    expect(themeColors('light')).toBe(spendioLight);
    expect(themeColors('dark')).toBe(spendioDark);
    expect(Object.values(themeColors('dark'))).not.toContain(critter.bodySunny);
  });
});

describe('acceptance: AA contrast passes in both themes', () => {
  // [foreground, background, minimum]. Text needs 4.5:1; stars, rings, and the bar fill need 3:1.
  // Rings sit on the white card and on the dimmed Skip card.
  const pairs: [keyof ThemeColors, keyof ThemeColors, number][] = [
    ['onSurface', 'surface', 4.5],
    ['onSurface', 'surfaceDim', 4.5],
    ['onSurface', 'surfaceSheet', 4.5],
    ['onSurfaceMuted', 'surface', 4.5],
    ['onSurfaceMuted', 'surfaceSheet', 4.5],
    ['scoreStarted', 'surface', 4.5],
    ['scoreOnTrack', 'surface', 4.5],
    ['scoreNailedIt', 'surface', 4.5],
    ['onPrimary', 'primary', 4.5],
    ['onInverse', 'inverse', 4.5],
    ['scoreStartedStar', 'surface', 3],
    ['scoreOnTrackStar', 'surface', 3],
    ['scoreNailedItStar', 'surface', 3],
    ['starScoreNeeded', 'surface', 3],
    ['starNotToday', 'surfaceDim', 3],
    ['primary', 'track', 3],
    ['habit1', 'surface', 3],
    ['habit2', 'surface', 3],
    ['habit3', 'surface', 3],
    ['habit4', 'surface', 3],
    ['habit5', 'surface', 3],
    ['habit6', 'surface', 3],
    ['habit7', 'surface', 3],
    ['habit8', 'surface', 3],
    ['habit1', 'surfaceDim', 3],
    ['habit2', 'surfaceDim', 3],
    ['habit3', 'surfaceDim', 3],
    ['habit4', 'surfaceDim', 3],
    ['habit5', 'surfaceDim', 3],
    ['habit6', 'surfaceDim', 3],
    ['habit7', 'surfaceDim', 3],
    ['habit8', 'surfaceDim', 3],
  ];

  for (const scheme of ['light', 'dark'] as const) {
    it.each(pairs)(`${scheme}: %s on %s is at least %d:1`, (fg, bg, min) => {
      const c = themeColors(scheme);
      expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(min);
    });
  }

  it('the contrast math matches known values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1);
  });
});

describe('withAlpha', () => {
  it('adds an opacity to a token color', () => {
    expect(withAlpha('#A855F7', 0.13)).toBe('#A855F721');
    expect(withAlpha('#1F1F1F', 1)).toBe('#1F1F1FFF');
    expect(withAlpha('#1F1F1F', -1)).toBe('#1F1F1F00');
  });
});
