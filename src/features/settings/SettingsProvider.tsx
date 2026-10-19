// Holds the Weekly goal style for every screen and saves it on the device (T11).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_GOAL_STYLE, loadGoalStyle, saveGoalStyle, type GoalStyle } from './settings';

interface SettingsContextValue {
  goalStyle: GoalStyle;
  setGoalStyle: (style: GoalStyle) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [goalStyle, setGoalStyleState] = useState<GoalStyle>(DEFAULT_GOAL_STYLE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadGoalStyle(AsyncStorage)
      .then(setGoalStyleState)
      .finally(() => setLoaded(true));
  }, []);

  const value = useMemo(
    () => ({
      goalStyle,
      setGoalStyle: (next: GoalStyle) => {
        setGoalStyleState(next);
        void saveGoalStyle(AsyncStorage, next);
      },
    }),
    [goalStyle],
  );

  // Wait for the saved setting so cards never flip from Ring to Dots on launch.
  if (!loaded) return null;
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}
