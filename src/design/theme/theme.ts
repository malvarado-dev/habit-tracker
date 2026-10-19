// Theme rules in plain TypeScript (no screens), so they can be unit tested.
// A theme covers only the habit sheet, cards, text, and Energy bar. The critter and the
// Background skies are separate token sets and never change with the theme (SPEC-00).

import { spendioDark, spendioLight, type ThemeColors } from '../tokens';

/** The Theme setting in Profile. Match phone is the default. */
export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
export const THEME_PREFERENCES: ThemePreference[] = ['system', 'light', 'dark'];
export const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Match phone',
  light: 'Light',
  dark: 'Dark',
};

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

/** Match phone follows the phone; if the phone doesn't say, use light. */
export function resolveScheme(
  preference: ThemePreference,
  phoneScheme: string | null | undefined,
): ColorScheme {
  if (preference !== 'system') return preference;
  return phoneScheme === 'dark' ? 'dark' : 'light';
}

export function themeColors(scheme: ColorScheme): ThemeColors {
  return scheme === 'dark' ? spendioDark : spendioLight;
}

/** The small part of storage the theme needs, so tests can pass a fake. */
export interface PreferenceStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const THEME_STORAGE_KEY = 'habit-tracker/theme';

/** Reads the saved Theme setting. Anything missing or broken falls back to Match phone. */
export async function loadThemePreference(storage: PreferenceStorage): Promise<ThemePreference> {
  try {
    const saved = await storage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(saved) ? saved : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

export async function saveThemePreference(
  storage: PreferenceStorage,
  preference: ThemePreference,
): Promise<void> {
  try {
    await storage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Not saving only means the setting resets next launch; nothing else depends on it.
  }
}

/** WCAG contrast ratio between two #RRGGBB colors, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r = 0, g = 0, bl = 0] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [dark, light] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}
