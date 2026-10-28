// Holds the app state for every screen and saves it on the device (no accounts, no database).
// On the web this uses the browser's storage; on phones, the app's own storage.
// Two trackers live here, Real and Test (T17, modes.ts). Screens only ever see the active one,
// and each tracker saves only to its own key, so Test can never touch real data.

import { healCheckIns } from '@/rules/quest';
import { petStats, type PetStat, type PetStats } from '@/rules/petStats';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState as RNAppState } from 'react-native';
import { DAY_EDITS, isStaleTap } from '@/rules/dayOnScreen';
import { useSettings } from '@/features/settings/SettingsProvider';
import { designView } from './designView';
import { setRemoved } from '@/features/habits/undoRemove';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';

import { toDateKey, type DateKey } from '@/rules/dates';
import {
  appReducer,
  createAppState,
  loadAppState,
  modeToday,
  oldestOpenableDay,
  openDaysFor,
  savesFor,
  type AppAction,
  type AppState,
  type Mode,
} from './modes';
import type { TrackerAction, TrackerState } from './state';

interface TrackerContextValue {
  /** The active tracker: Real, or Test while Test mode is on. */
  state: TrackerState;
  /** Full active save for management forms, before the Today design filters it. */
  managementState: TrackerState;
  dispatch: Dispatch<TrackerAction>;
  /** The date the active tracker lives on. Real is always the real date; Test can be ahead. */
  today: DateKey;
  mode: Mode;
  /** Days before today that can still be changed: 2 in Real, 45 in Test (T22). */
  openDays: number;
  /** The oldest day that can be opened, or null when every past day can (Real). */
  oldestDay: DateKey | null;
  setMode: (mode: Mode) => void;
  /** Test tools (prototype only). Each does nothing in Real. */
  testTools: {
    dayOffset: number;
    nextDay: () => void;
    backToToday: () => void;
    reset: () => void;
    /** Checks in every habit on the pretend day. */
    fillToday: () => void;
    /** The Test pet's Love and Confidence, 0 to 100 (P2-13). */
    stats: PetStats;
    setStat: (stat: PetStat, value: number) => void;
    /** The Test save's Heal quest check-in days (P2-15). */
    healCheckIns: number;
    setHealCheckIns: (count: number) => void;
    resetQuest: () => void;
    /** Sends the Test pet exploring now (P2-16). */
    sendExploring: () => void;
  };
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

type InternalAction = AppAction | { type: 'load'; app: AppState };

function reducer(app: AppState, action: InternalAction): AppState {
  // A load keeps the design in use: it's a setting, not part of the saves.
  return action.type === 'load' ? { ...action.app, design: app.design } : appReducer(app, action);
}

/** The real date, never moved by test tools. */
const realDate = () => toDateKey(new Date());

export function TrackerProvider({ children }: { children: ReactNode }) {
  // Settings load first (SettingsProvider waits), so the design is right from the first frame.
  const { badHabitDesign } = useSettings();
  const [app, rawDispatch] = useReducer(reducer, badHabitDesign, (design) => ({
    ...createAppState(),
    design,
  }));
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(realDate);
  // What's on the device, so only changed pieces are written.
  const saved = useRef<AppState | null>(null);

  useEffect(() => {
    loadAppState(AsyncStorage, new Date())
      .then((loadedApp) => {
        // Lock before anything else can change the data.
        const withDesign = { ...loadedApp, design: badHabitDesign };
        const locked = appReducer(withDesign, { type: 'lock', realDate: realDate() });
        saved.current = loadedApp;
        rawDispatch({ type: 'load', app: locked });
      })
      .finally(() => setLoaded(true));
    // Runs once on launch with the saved design; later switches go through setDesign below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rawDispatch({ type: 'setDesign', design: badHabitDesign });
  }, [badHabitDesign]);

  useEffect(() => {
    // Don't save until the old saves have loaded, or fresh state would overwrite them.
    if (!loaded || !saved.current) return;
    for (const [key, value] of savesFor(saved.current, app)) {
      AsyncStorage.setItem(key, value).catch(() => {});
    }
    saved.current = app;
  }, [app, loaded]);

  useEffect(() => {
    // Lock days that closed while the app is open. Today itself stays on the day on screen
    // until the app is opened again or comes back from the background (P2-18a).
    const timer = setInterval(() => {
      rawDispatch({ type: 'lock', realDate: realDate() });
    }, 60_000);
    const sub = RNAppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      setNow(realDate());
      rawDispatch({ type: 'lock', realDate: realDate() });
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  // The latest app state for taps, which run outside render.
  const latest = useRef(app);
  useEffect(() => {
    latest.current = app;
  }, [app]);

  // Screens change only the active tracker; the app reducer locks it first.
  const dispatch = useCallback<Dispatch<TrackerAction>>((action) => {
    // A tap on a day that has locked since the screen was drawn moves Today to the real day.
    if (DAY_EDITS.has(action.type) && 'date' in action) {
      const current = latest.current;
      const realToday = modeToday(current, realDate());
      if (isStaleTap(action.date, realToday, openDaysFor(current.mode))) {
        setNow(realDate());
        return;
      }
    }
    rawDispatch({ type: 'tracker', action, realDate: realDate() });
  }, []);

  const value = useMemo<TrackerContextValue>(
    () => ({
      state: designView(app[app.mode].state, badHabitDesign),
      managementState: app[app.mode].state,
      dispatch,
      today: modeToday(app, now),
      mode: app.mode,
      openDays: openDaysFor(app.mode),
      oldestDay: oldestOpenableDay(app.mode, modeToday(app, now)),
      setMode: (mode) => {
        setRemoved(null);
        rawDispatch({ type: 'setMode', mode });
      },
      testTools: {
        dayOffset: app.mode === 'test' ? app.testOffset : 0,
        nextDay: () => rawDispatch({ type: 'nextDay', realDate: realDate() }),
        backToToday: () => rawDispatch({ type: 'backToToday' }),
        reset: () => rawDispatch({ type: 'resetTest', realDate: realDate() }),
        fillToday: () => rawDispatch({ type: 'fillTestDay', realDate: realDate() }),
        stats: petStats(app.test.state),
        setStat: (stat, value) =>
          rawDispatch({ type: 'setTestStat', stat, value, realDate: realDate() }),
        healCheckIns: healCheckIns(app.test.state, modeToday(app, now, 'test')),
        setHealCheckIns: (count) =>
          rawDispatch({ type: 'setTestHealCheckIns', count, realDate: realDate() }),
        resetQuest: () => rawDispatch({ type: 'resetTestQuest', realDate: realDate() }),
        sendExploring: () => rawDispatch({ type: 'sendTestExploring', realDate: realDate() }),
      },
    }),
    [app, dispatch, now, badHabitDesign],
  );

  if (!loaded) return null;
  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker(): TrackerContextValue {
  const value = useContext(TrackerContext);
  if (!value) throw new Error('useTracker must be used inside TrackerProvider');
  return value;
}

/** Manage saved habits without hiding mirror habits or replacing saved frequencies. */
export function useManageTracker() {
  const tracker = useTracker();
  return { ...tracker, state: tracker.managementState };
}
