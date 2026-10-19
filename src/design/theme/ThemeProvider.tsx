// Holds the Theme setting for every screen and saves it on the device.
// Screens call useTheme() for sheet, card, text, and Energy bar colors. The critter and
// Background colors are imported from tokens directly, never from here.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { ThemeColors } from '../tokens';
import {
  DEFAULT_THEME_PREFERENCE,
  loadThemePreference,
  resolveScheme,
  saveThemePreference,
  themeColors,
  type ColorScheme,
  type ThemePreference,
} from './theme';

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  scheme: ColorScheme;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const phoneScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadThemePreference(AsyncStorage)
      .then(setPreferenceState)
      .finally(() => setLoaded(true));
  }, []);

  const value = useMemo(() => {
    const scheme = resolveScheme(preference, phoneScheme);
    return {
      preference,
      setPreference: (next: ThemePreference) => {
        setPreferenceState(next);
        void saveThemePreference(AsyncStorage, next);
      },
      scheme,
      colors: themeColors(scheme),
    };
  }, [preference, phoneScheme]);

  // Wait for the saved setting so a dark-theme user never sees a light flash on launch.
  if (!loaded) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
