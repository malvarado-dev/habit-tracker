// Holds the Weekly goal style (T11) and the bad habit Design switch (P2-05) for every screen and
// saves them on the device.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  DEFAULT_BAD_HABIT_DESIGN,
  DEFAULT_GOAL_STYLE,
  loadBadHabitDesign,
  loadGoalStyle,
  saveBadHabitDesign,
  saveGoalStyle,
  type BadHabitDesign,
  type GoalStyle,
} from './settings';

interface SettingsContextValue {
  goalStyle: GoalStyle;
  setGoalStyle: (style: GoalStyle) => void;
  badHabitDesign: BadHabitDesign;
  setBadHabitDesign: (design: BadHabitDesign) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [goalStyle, setGoalStyleState] = useState<GoalStyle>(DEFAULT_GOAL_STYLE);
  const [badHabitDesign, setDesignState] = useState<BadHabitDesign>(DEFAULT_BAD_HABIT_DESIGN);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      loadGoalStyle(AsyncStorage).then(setGoalStyleState),
      loadBadHabitDesign(AsyncStorage).then(setDesignState),
    ]).finally(() => setLoaded(true));
  }, []);

  const value = useMemo(
    () => ({
      goalStyle,
      setGoalStyle: (next: GoalStyle) => {
        setGoalStyleState(next);
        void saveGoalStyle(AsyncStorage, next);
      },
      badHabitDesign,
      setBadHabitDesign: (next: BadHabitDesign) => {
        setDesignState(next);
        void saveBadHabitDesign(AsyncStorage, next);
      },
    }),
    [goalStyle, badHabitDesign],
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
