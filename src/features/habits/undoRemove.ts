// The habit just removed, so the Habits screen can offer Undo after Edit habit closes.
// Lives outside the saved state: Undo is only for the next few seconds, not after a restart.

import { useSyncExternalStore } from 'react';

import type { Habit } from '@/rules/habits';

export interface RemovedHabit {
  habit: Habit;
  /** Where it was on the list, so Undo puts it back in the same spot. */
  index: number;
}

let current: RemovedHabit | null = null;
const listeners = new Set<() => void>();

export function setRemoved(value: RemovedHabit | null): void {
  current = value;
  listeners.forEach((l) => l());
}

export function getRemoved(): RemovedHabit | null {
  return current;
}

export function useRemovedHabit(): RemovedHabit | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getRemoved,
    getRemoved,
  );
}
