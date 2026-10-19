// Holds the app state for every screen and saves it on the device (no accounts, no database).
// On the web this uses the browser's storage; on phones, the app's own storage.
// Two trackers live here, Real and Test (T17, modes.ts). Screens only ever see the active one,
// and each tracker saves only to its own key, so Test can never touch real data.

import AsyncStorage from '@react-native-async-storage/async-storage';
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
  savesFor,
  type AppAction,
  type AppState,
  type Mode,
} from './modes';
import type { TrackerAction, TrackerState } from './state';

interface TrackerContextValue {
  /** The active tracker: Real, or Test while Test mode is on. */
  state: TrackerState;
  dispatch: Dispatch<TrackerAction>;
  /** The date the active tracker lives on. Real is always the real date; Test can be ahead. */
  today: DateKey;
  mode: Mode;
  setMode: (mode: Mode) => void;
  /** Test tools (prototype only). Each does nothing in Real. */
  testTools: {
    dayOffset: number;
    nextDay: () => void;
    backToToday: () => void;
    reset: () => void;
  };
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

type InternalAction = AppAction | { type: 'load'; app: AppState };

function reducer(app: AppState, action: InternalAction): AppState {
  return action.type === 'load' ? action.app : appReducer(app, action);
}

/** The real date, never moved by test tools. */
const realDate = () => toDateKey(new Date());

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [app, rawDispatch] = useReducer(reducer, undefined, createAppState);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(realDate);
  // What's on the device, so only changed pieces are written.
  const saved = useRef<AppState | null>(null);

  useEffect(() => {
    loadAppState(AsyncStorage, new Date())
      .then((loadedApp) => {
        // Lock before anything else can change the data.
        const locked = appReducer(loadedApp, { type: 'lock', realDate: realDate() });
        saved.current = loadedApp;
        rawDispatch({ type: 'load', app: locked });
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    // Don't save until the old saves have loaded, or fresh state would overwrite them.
    if (!loaded || !saved.current) return;
    for (const [key, value] of savesFor(saved.current, app)) {
      AsyncStorage.setItem(key, value).catch(() => {});
    }
    saved.current = app;
  }, [app, loaded]);

  useEffect(() => {
    // Notice when midnight passes while the app is open, and lock the day that just closed.
    const timer = setInterval(() => {
      setNow(realDate());
      rawDispatch({ type: 'lock', realDate: realDate() });
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Screens change only the active tracker; the app reducer locks it first.
  const dispatch = useCallback<Dispatch<TrackerAction>>((action) => {
    rawDispatch({ type: 'tracker', action, realDate: realDate() });
  }, []);

  const value = useMemo<TrackerContextValue>(
    () => ({
      state: app[app.mode].state,
      dispatch,
      today: modeToday(app, now),
      mode: app.mode,
      setMode: (mode) => rawDispatch({ type: 'setMode', mode }),
      testTools: {
        dayOffset: app.mode === 'test' ? app.testOffset : 0,
        nextDay: () => rawDispatch({ type: 'nextDay', realDate: realDate() }),
        backToToday: () => rawDispatch({ type: 'backToToday' }),
        reset: () => rawDispatch({ type: 'resetTest', realDate: realDate() }),
      },
    }),
    [app, dispatch, now],
  );

  if (!loaded) return null;
  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker(): TrackerContextValue {
  const value = useContext(TrackerContext);
  if (!value) throw new Error('useTracker must be used inside TrackerProvider');
  return value;
}
