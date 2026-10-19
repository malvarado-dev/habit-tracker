// Holds the app state for every screen and saves it on the device (no accounts, no database).
// On the web this uses the browser's storage; on phones, the app's own storage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';

import { addDays, toDateKey, type DateKey } from '@/rules/dates';
import { backupKey, loadSave } from './save';
import { createInitialState, trackerReducer, type TrackerAction, type TrackerState } from './state';

const STORAGE_KEY = 'habit-tracker/prototype';

interface TrackerContextValue {
  state: TrackerState;
  dispatch: Dispatch<TrackerAction>;
  /** Today's date, moved forward by the Next day test tool. */
  today: DateKey;
  /** The real date. Locking and History's open days use this, never the test date. */
  realToday: DateKey;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

/** Swaps in a saved state once it has loaded. */
type InternalAction = TrackerAction | { type: 'load'; state: TrackerState };

function reducer(state: TrackerState, action: InternalAction): TrackerState {
  return action.type === 'load' ? action.state : trackerReducer(state, action);
}

/** The real date, never moved by test tools. Locking always uses this (T16). */
const realDate = () => toDateKey(new Date());

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, createInitialState);
  const [loaded, setLoaded] = useState(false);
  // False when the save on the device came from a newer app: it's left alone, never overwritten.
  const [canSave, setCanSave] = useState(true);
  const [realToday, setRealToday] = useState(realDate);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        const result = loadSave(raw);
        if (result.kind === 'loaded') {
          // Lock before anything else can change the data.
          rawDispatch({ type: 'load', state: trackerReducer(result.state, lockAction()) });
        } else if (result.kind === 'unreadable') {
          // Keep the broken save in its own backup slot, then start fresh beside it.
          await AsyncStorage.setItem(backupKey(STORAGE_KEY, new Date()), result.raw);
        } else if (result.kind === 'newer') {
          setCanSave(false);
        }
      })
      .catch(() => {
        // Storage itself failed. Don't save over whatever is there.
        setCanSave(false);
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    // Don't save until the old save has loaded, or a fresh state would overwrite it.
    if (!loaded || !canSave) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded, canSave]);

  useEffect(() => {
    // Notice when midnight passes while the app is open, and lock the day that just closed.
    const timer = setInterval(() => {
      setRealToday(realDate());
      rawDispatch(lockAction());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Every change locks first, so a day can't be edited in the minute after it locks.
  const dispatch = useCallback<Dispatch<TrackerAction>>((action) => {
    rawDispatch(lockAction());
    rawDispatch(action);
  }, []);

  const value = useMemo(
    () => ({ state, dispatch, today: addDays(realToday, state.dayOffset), realToday }),
    [state, dispatch, realToday],
  );

  if (!loaded) return null;
  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

function lockAction(): TrackerAction {
  return { type: 'lockDays', today: realDate() };
}

export function useTracker(): TrackerContextValue {
  const value = useContext(TrackerContext);
  if (!value) throw new Error('useTracker must be used inside TrackerProvider');
  return value;
}
