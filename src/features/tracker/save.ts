// Loading a save from the device. Saved data is upgraded, never dropped (SPEC-00, T16):
// every save shape has a version number, and each version has a small step that upgrades
// the version before it. Steps run in order, so any older save reaches the current shape.
// A save that can't be read or upgraded is kept in a backup slot. A save from a newer app
// is left alone. No screens here, so every path is unit tested.

import { tuning } from '@/config/tuning';
import type { DateKey } from '@/rules/dates';
import type { Habit, LogCounts, Weekday } from '@/rules/habits';
import { dayResult, allHabits, type LockedDay } from '@/rules/locking';
import type { TrackerState } from './state';

export const CURRENT_VERSION = 12;

/** Before v9 (Prototype 1 and P2-07): a check-in was a star level per habit per day. */
type OldCheckIn = 'NotToday' | 'Started' | 'OnTrack' | 'NailedIt';
type CheckInLog = Record<string, Record<string, OldCheckIn>>;
/** Before v9, habits had a weekly goal instead of a schedule. */
type OldGoal =
  { kind: 'specificDays'; days: Weekday[] } | { kind: 'anyDays'; timesPerWeek: number };
type OldHabit = Omit<Habit, 'schedule' | 'timesPerDay'> & { goal: OldGoal };

/** v3 (before T16): habits, check-ins, and the test-tools day offset. */
interface SaveV3 {
  version: 3;
  habits: OldHabit[];
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

function isV5Shape(v: Record<string, unknown>, version: 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12): boolean {
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
const isV8 = (v: Record<string, unknown>) =>
  isV5Shape(v, 8) &&
  Array.isArray(v.removed) &&
  isObject(v.pet) &&
  typeof v.pet.confidence === 'number';
const isV9 = (v: Record<string, unknown>) =>
  isV5Shape(v, 9) &&
  Array.isArray(v.removed) &&
  isObject(v.pet) &&
  typeof v.pet.confidence === 'number' &&
  isObject(v.targets);
const isV10 = (v: Record<string, unknown>) =>
  isV5Shape(v, 10) &&
  Array.isArray(v.removed) &&
  isObject(v.pet) &&
  typeof v.pet.confidence === 'number' &&
  isObject(v.targets) &&
  Array.isArray(v.badHabits) &&
  isObject(v.slips);
const isV11 = (v: Record<string, unknown>) =>
  isV5Shape(v, 11) &&
  Array.isArray(v.removed) &&
  isObject(v.pet) &&
  typeof v.pet.confidence === 'number' &&
  isObject(v.targets) &&
  Array.isArray(v.badHabits) &&
  isObject(v.slips) &&
  isObject(v.skips);
const isV12 = (v: Record<string, unknown>): v is TrackerState & Record<string, unknown> =>
  isV11({ ...v, version: 11 }) && v.version === 12 && isObject(v.designTallies);

/** v9: a weekly goal becomes a schedule (when it's due), and every habit starts at 1 time a day. */
function upgradeHabit(old: OldHabit): Habit {
  const { goal, ...rest } = old;
  const schedule: Habit['schedule'] =
    goal?.kind === 'specificDays' ? { kind: 'specificDays', days: goal.days } : { kind: 'anyDays' };
  return { ...rest, schedule };
}

/** v9: any star level becomes 1 log. Skip is dropped. */
function upgradeLog(old: CheckInLog): LogCounts {
  const log: LogCounts = {};
  for (const [date, day] of Object.entries(old)) {
    const counts: Record<string, number> = {};
    for (const [id, checkIn] of Object.entries(day ?? {})) {
      if (checkIn === 'Started' || checkIn === 'OnTrack' || checkIn === 'NailedIt') counts[id] = 1;
    }
    if (Object.keys(counts).length > 0) log[date] = counts;
  }
  return log;
}

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
  // v8 to v9 (P2-08a): stars, ranks and weekly goals are gone. Each star level becomes 1 log and
  // Skip is dropped. Weekly goals become schedules. Locked days are worked out again from their
  // converted logs with the Activity Bar rules (decided 2026-10-25), since a rank can't say
  // whether the new bar would have filled. Locked days stay locked.
  8: (save) => {
    if (!isV8(save)) throw new Error('Not a valid v8 save');
    const habits = (save.habits as OldHabit[]).map(upgradeHabit);
    const removed = (save.removed as OldHabit[]).map(upgradeHabit);
    const log = upgradeLog(save.log as CheckInLog);
    const all = allHabits({ habits, removed });
    const locked: Record<DateKey, LockedDay> = {};
    for (const date of Object.keys(save.locked as Record<string, unknown>)) {
      if (!log[date]) continue;
      locked[date] = dayResult(all, log, date);
    }
    return { ...save, version: 9, habits, removed, log, targets: {}, locked };
  },
  // v9 to v10 (P2-09): adds bad habits and their slips, both empty. Everything else is copied
  // exactly as it was.
  9: (save) => {
    if (!isV9(save)) throw new Error('Not a valid v9 save');
    return { ...save, version: 10, badHabits: [], slips: {} };
  },
  // v10 to v11 (P2-08b): adds skipped habits, empty. Everything else is copied as it was.
  10: (save) => {
    if (!isV10(save)) throw new Error('Not a valid v10 save');
    return { ...save, version: 11, skips: {} };
  },
  // v11 to v12 (P2-10): adds the per-design playtest tally, empty. Older logs have no design, so
  // they aren't counted in it. Everything else is copied as it was.
  11: (save) => {
    if (!isV11(save)) throw new Error('Not a valid v11 save');
    return { ...save, version: 12, designTallies: {} };
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

  if (!isV12(save)) return { kind: 'unreadable', raw };
  return { kind: 'loaded', state: save, upgradedFrom: from === CURRENT_VERSION ? null : from };
}

/** Where an unreadable save is copied. A new key each time, so a backup is never overwritten. */
export function backupKey(storageKey: string, now: Date): string {
  return `${storageKey}/backup/${now.toISOString()}`;
}
