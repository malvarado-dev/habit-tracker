// Holds the bad habit Design switch (P2-05) and the pet look (P2-15a) for every screen and saves
// them on the device. "Show bandages" is a Test tools check only, so it isn't saved.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  DEFAULT_BAD_HABIT_DESIGN,
  loadBadHabitDesign,
  loadPetLook,
  saveBadHabitDesign,
  savePetLook,
  type BadHabitDesign,
} from './settings';
import { DEFAULT_PET_LOOK, type PetLookId } from '@/scene/petLookData';

interface SettingsContextValue {
  badHabitDesign: BadHabitDesign;
  setBadHabitDesign: (design: BadHabitDesign) => void;
  petLook: PetLookId;
  setPetLook: (look: PetLookId) => void;
  showBandages: boolean;
  setShowBandages: (on: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [badHabitDesign, setDesignState] = useState<BadHabitDesign>(DEFAULT_BAD_HABIT_DESIGN);
  const [petLook, setLookState] = useState<PetLookId>(DEFAULT_PET_LOOK);
  const [showBandages, setShowBandages] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      loadBadHabitDesign(AsyncStorage).then(setDesignState),
      loadPetLook(AsyncStorage).then(setLookState),
    ]).finally(() => setLoaded(true));
  }, []);

  const value = useMemo(
    () => ({
      badHabitDesign,
      setBadHabitDesign: (next: BadHabitDesign) => {
        setDesignState(next);
        void saveBadHabitDesign(AsyncStorage, next);
      },
      petLook,
      setPetLook: (next: PetLookId) => {
        setLookState(next);
        void savePetLook(AsyncStorage, next);
      },
      showBandages,
      setShowBandages,
    }),
    [badHabitDesign, petLook, showBandages],
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
