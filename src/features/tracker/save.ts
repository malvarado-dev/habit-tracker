// Loading a save from the device. Saved data is upgraded, never dropped (SPEC-00, T16):
// every save shape has a version number, and each version has a small step that upgrades
// the version before it. Steps run in order, so any older save reaches the current shape.
// A save that can't be read or upgraded is kept in a backup slot. A save from a newer app
// is left alone. No screens here, so every path is unit tested.

import type { CheckInLog, Habit } from '@/rules/scoring';
import { tuning } from '@/config/tuning';
import type { TrackerState } from './state';

export const CURRENT_VERSION = 8;

/** v3 (before T16): habits, check-ins, and the test-tools day offset. */
interface SaveV3 {
  version: 3;
  habits: Habit[];
  log: CheckInLog;
  dayOffset: number;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function isV3(v: Record<string, unknown>): v is SaveV3 & Record<string, unknown> {
  return (
    v.version === 3 && Array.isArray(v.habits) && isObject(v.log) && typeof v.dayOffset === 'number'
  );
}

/** v4 (T16): v3 plus locked days. */
interface SaveV4 extends Omit<SaveV3, 'version'> {
  version: 4;
  locked: Record<string, unknown>;
  lockedThrough: string | null;
}

function isV4(v: Record<string, unknown>): v is SaveV4 & Record<string, unknown> {
  return (
    v.version === 4 &&
    Array.isArray(v.habits) &&
    isObject(v.log) &&
    typeof v.dayOffset === 'number' &&
    isObject(v.locked) &&
    (v.lockedThrough === null || typeof v.lockedThrough === 'string')
  );
}

function isV5Shape(v: Record<string, unknown>, version: 5 | 6 | 7 | 8): boolean {
  return (
    v.version === version &&
    Array.isArray(v.habits) &&
    isObject(v.log) &&
    isObject(v.locked) &&
    (v.lockedThrough === null || typeof v.lockedThrough === 'string')
  );
}

const isV5 = (v: Record<string, unknown>) => isV5Shape(v, 5);
const isV6 = (v: Record<string, unknown>) => isV5Shape(v, 6);
const isV7 = (v: Record<string, unknown>) => isV5Shape(v, 7) && Array.isArray(v.removed);
const isV8 = (v: Record<string, unknown>): v is TrackerState & Record<string, unknown> =>
  isV5Shape(v, 8) &&
  Array.isArray(v.removed) &&
  isObject(v.pet) &&
  typeof v.pet.confidence === 'number';

/** One step per version: takes a valid save of that version, returns the next version. */
const UPGRADES: Record<number, (save: Record<string, unknown>) => Record<string, unknown>> = {
  // v3 to v4: adds locked days. Habits and check-ins are copied exactly as they were.
  3: (save) => {
    if (!isV3(save)) throw new Error('Not a valid v3 save');
    const v4: SaveV4 = {
      version: 4,
      habits: save.habits,
      log: save.log,
      dayOffset: save.dayOffset,
      locked: {},
      lockedThrough: null,
    };
    return v4 as unknown as Record<string, unknown>;
  },
  // v4 to v5 (T17): the pretend date leaves the save. Test mode keeps its own, apart from this
  // shape, so the real save can never be moved off today. Everything else is copied as it was.
  4: (save) => {
    if (!isV4(save)) throw new Error('Not a valid v4 save');
    const v5 = {
      version: 5,
      habits: save.habits,
      log: save.log,
      locked: save.locked as TrackerState['locked'],
      lockedThrough: save.lockedThrough,
    };
    return v5 as unknown as Record<string, unknown>;
  },
  // v5 to v6 (#52): habits can remember the day they were added. Existing habits get no date, so
  // they keep their full goals. Everything is copied exactly as it was.
  5: (save) => {
    if (!isV5(save)) throw new Error('Not a valid v5 save');
    return { ...save, version: 6 };
  },
  // v6 to v7 (T21): removed habits are kept with the day they were removed. Habits removed
  // before this have no record, so nothing changes for them. Everything else is copied as it was.
  6: (save) => {
    if (!isV6(save)) throw new Error('Not a valid v6 save');
    return { ...save, version: 7, removed: [] };
  },
  // v7 to v8 (P2-05): adds the pet with its starting Confidence. Habits, check-ins and locked
  // days are copied exactly as they were, so Prototype 1 tracking carries into Prototype 2.
  7: (save) => {
    if (!isV7(save)) throw new Error('Not a valid v7 save');
    return { ...save, version: 8, pet: { confidence: tuning.pet.startConfidence } };
  },
};

export type LoadResult =
  /** Nothing saved yet. */
  | { kind: 'empty' }
  /** A save of this version, or an older one upgraded to it. */
  | { kind: 'loaded'; state: TrackerState; upgradedFrom: number | null }
  /** Couldn't be read or upgraded. Keep `raw` in a backup slot and start fresh beside it. */
  | { kind: 'unreadable'; raw: string }
  /** Made by a newer app. Leave it alone: don't load it, and never save over it. */
  | { kind: 'newer'; version: number };

export function loadSave(raw: string | null): LoadResult {
  if (raw === null) return { kind: 'empty' };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { kind: 'unreadable', raw };
  }
  if (!isObject(data) || typeof data.version !== 'number') return { kind: 'unreadable', raw };

  const from = data.version;
  if (from > CURRENT_VERSION) return { kind: 'newer', version: from };

  let save: Record<string, unknown> = data;
  try {
    for (let version = from; version < CURRENT_VERSION; version++) {
      const step = UPGRADES[version];
      if (!step) return { kind: 'unreadable', raw };
      save = step(save);
    }
  } catch {
    return { kind: 'unreadable', raw };
  }

  if (!isV8(save)) return { kind: 'unreadable', raw };
  return { kind: 'loaded', state: save, upgradedFrom: from === CURRENT_VERSION ? null : from };
}

/** Where an unreadable save is copied. A new key each time, so a backup is never overwritten. */
export function backupKey(storageKey: string, now: Date): string {
  return `${storageKey}/backup/${now.toISOString()}`;
}
