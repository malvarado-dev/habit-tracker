// Holds the bad habit Design switch (P2-05) for every screen and saves it on the device.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  DEFAULT_BAD_HABIT_DESIGN,
  loadBadHabitDesign,
  saveBadHabitDesign,
  type BadHabitDesign,
} from './settings';

interface SettingsContextValue {
  badHabitDesign: BadHabitDesign;
  setBadHabitDesign: (design: BadHabitDesign) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [badHabitDesign, setDesignState] = useState<BadHabitDesign>(DEFAULT_BAD_HABIT_DESIGN);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadBadHabitDesign(AsyncStorage)
      .then(setDesignState)
      .finally(() => setLoaded(true));
  }, []);

  const value = useMemo(
    () => ({
      badHabitDesign,
      setBadHabitDesign: (next: BadHabitDesign) => {
        setDesignState(next);
        void saveBadHabitDesign(AsyncStorage, next);
      },
    }),
    [badHabitDesign],
  );

  // Wait for the saved setting so the layout never flips on launch.
  if (!loaded) return null;
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}
