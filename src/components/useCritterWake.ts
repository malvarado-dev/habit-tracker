// Whether the wide layout's critter is awake, kept out of the screen files. Today and the Day
// screen both use it. The critter wakes on a tap or any log, and falls back asleep when the app is
// closed or a new day starts. While the screen is hidden under another one, logs don't wake it.
// The rank moment that used to live here was removed with ranks (P2-08a); the full-bar
// celebration lives on the Activity Bar.

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { DateKey } from '@/rules/dates';

export function useCritterWake(day: DateKey, logKey: string, active: boolean = true) {
  const [woken, setWoken] = useState(false);
  const [seen, setSeen] = useState({ day, logKey });

  // Worked out while rendering, not in an effect. A new day: asleep again. Any log wakes the
  // critter, but only while the screen is showing.
  if (seen.day !== day) {
    setSeen({ day, logKey });
    setWoken(false);
  } else if (seen.logKey !== logKey) {
    setSeen({ day, logKey });
    if (active) setWoken(true);
  }

  // Closing the app (or switching away) puts it back to sleep.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') setWoken(false);
    });
    return () => sub.remove();
  }, []);

  return { woken, wake: () => setWoken(true) };
}
