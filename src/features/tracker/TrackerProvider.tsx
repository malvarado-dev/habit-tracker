// Holds the app state for every screen and saves it on the device (no accounts, no database).
// On the web this uses the browser's storage; on phones, the app's own storage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';

import { addDays, toDateKey, type DateKey } from '@/rules/dates';
import {
  createInitialState,
  isTrackerState,
  trackerReducer,
  type TrackerAction,
  type TrackerState,
} from './state';

const STORAGE_KEY = 'habit-tracker/prototype';

interface TrackerContextValue {
  state: TrackerState;
  dispatch: Dispatch<TrackerAction>;
  /** Today's date, moved forward by the Next day test tool. */
  today: DateKey;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

/** Swaps in a saved state once it has loaded. */
type InternalAction = TrackerAction | { type: 'load'; state: TrackerState };

function reducer(state: TrackerState, action: InternalAction): TrackerState {
  return action.type === 'load' ? action.state : trackerReducer(state, action);
}

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [loaded, setLoaded] = useState(false);
  const [realToday, setRealToday] = useState(() => toDateKey(new Date()));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        const parsed: unknown = saved ? JSON.parse(saved) : null;
        if (isTrackerState(parsed)) dispatch({ type: 'load', state: parsed });
      })
      .catch(() => {
        // A broken or unreadable save just means a fresh start; nothing else depends on it.
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    // Don't save until the old save has loaded, or a fresh state would overwrite it.
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  useEffect(() => {
    // Notice when midnight passes while the app is open.
    const timer = setInterval(() => setRealToday(toDateKey(new Date())), 60_000);
    return () => clearInterval(timer);
  }, []);

  const value = useMemo(
    () => ({ state, dispatch, today: addDays(realToday, state.dayOffset) }),
    [state, realToday],
  );

  if (!loaded) return null;
  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker(): TrackerContextValue {
  const value = useContext(TrackerContext);
  if (!value) throw new Error('useTracker must be used inside TrackerProvider');
  return value;
}
