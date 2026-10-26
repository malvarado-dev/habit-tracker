import { describe, expect, it } from '@jest/globals';

import { tuning } from '@/config/tuning';
import { backupKey, CURRENT_VERSION, loadSave } from './save';
import { createInitialState } from './state';

const START_PET = { confidence: tuning.pet.startConfidence };
const EVERY = [0, 1, 2, 3, 4, 5, 6];

// Prototype 1 habits, as they were saved before v9: a weekly goal, no schedule.
const OLD_HABITS = [
  { id: 'sleep', name: 'Sleep', goal: { kind: 'specificDays', days: EVERY }, color: 'habit1' },
  { id: 'exercise', name: 'Exercise', goal: { kind: 'anyDays', timesPerWeek: 3 }, color: 'habit5' },
  { id: 'read', name: 'Reading', goal: { kind: 'specificDays', days: [0, 2, 4] }, color: 'habit2' },
];

// A real-looking v3 save: a custom habit and check-ins across two weeks.
const v3 = {
  version: 3,
  habits: OLD_HABITS,
  log: {
    '2026-10-12': { sleep: 'NailedIt', read: 'NotToday' },
    '2026-10-13': { exercise: 'Started' },
    '2026-10-18': {},
    '2026-10-19': { exercise: 'OnTrack', read: 'NailedIt' },
  },
  dayOffset: 2,
};

// The last save before P2-08a. Oct 12 locked as an A rank with Sleep only; Oct 13 locked as a
// Rest day with only Exercise; Oct 14 locked with one Skip and nothing else.
const v8 = {
  version: 8,
  habits: OLD_HABITS,
  removed: [],
  pet: { confidence: 40 },
  log: {
    '2026-10-12': { sleep: 'NailedIt', read: 'NotToday' },
    '2026-10-13': { exercise: 'Started' },
    '2026-10-14': { sleep: 'NotToday' },
    '2026-10-20': { sleep: 'Started' },
  },
  locked: {
    '2026-10-12': { outcome: 'rank', rank: 'A', earnedStars: 3, possibleStars: 3 },
    '2026-10-13': { outcome: 'rest', earnedStars: 1, possibleStars: 3 },
    '2026-10-14': { outcome: 'rest', earnedStars: 0, possibleStars: 0 },
  },
  lockedThrough: '2026-10-14',
};

describe('loadSave', () => {
  it('nothing saved means an empty start', () => {
    expect(loadSave(null)).toEqual({ kind: 'empty' });
  });

  describe('v8 to v9 (P2-08a)', () => {
    const result = loadSave(JSON.stringify(v8));
    const state = result.kind === 'loaded' ? result.state : null;

    it('loads, upgraded from v8', () => {
      expect(result.kind).toBe('loaded');
      expect(result.kind === 'loaded' && result.upgradedFrom).toBe(8);
      expect(state?.version).toBe(CURRENT_VERSION);
    });

    it('old stars become 1 log, and Skip is dropped', () => {
      expect(state?.log).toEqual({
        '2026-10-12': { sleep: 1 },
        '2026-10-13': { exercise: 1 },
        '2026-10-20': { sleep: 1 },
      });
    });

    it('weekly goals become schedules, and every habit is once a day', () => {
      expect(state?.habits.map((h) => h.schedule)).toEqual([
        { kind: 'specificDays', days: EVERY },
        { kind: 'anyDays' },
        { kind: 'specificDays', days: [0, 2, 4] },
      ]);
      expect(state?.habits.every((h) => !('goal' in h) && h.timesPerDay === undefined)).toBe(true);
    });

    it('locked days are worked out again with the Activity Bar rules', () => {
      // Oct 12 (Mon): Sleep and Reading due, 2 possible, needs 2. Only Sleep logged: no check-in.
      expect(state?.locked['2026-10-12']).toEqual({ outcome: 'none', logs: 1, target: 2 });
      // Oct 13 (Tue): only Sleep due, needs 1. Exercise is a bonus log, so it fills.
      expect(state?.locked['2026-10-13']).toEqual({ outcome: 'checkIn', logs: 1, target: 1 });
      // Oct 14 had only a Skip: no logs left, so no locked result.
      expect(state?.locked['2026-10-14']).toBeUndefined();
      expect(state?.lockedThrough).toBe('2026-10-14');
    });

    it('keeps the pet and starts with no saved targets', () => {
      expect(state?.pet).toEqual({ confidence: 40 });
      expect(state?.targets).toEqual({});
    });
  });

  it('v9 to v10 (P2-09) adds empty bad habits and slips, and keeps everything else', () => {
    const { badHabits: _b, slips: _s, ...rest } = createInitialState();
    const v9 = { ...rest, version: 9, log: { '2026-10-20': { sleep: 1 } } };
    const result = loadSave(JSON.stringify(v9));
    expect(result).toEqual({
      kind: 'loaded',
      state: { ...v9, version: 10, badHabits: [], slips: {} },
      upgradedFrom: 9,
    });
  });

  it('upgrades a v3 save all the way to the current shape', () => {
    const result = loadSave(JSON.stringify(v3));
    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') return;
    expect(result.upgradedFrom).toBe(3);
    expect(result.state.version).toBe(CURRENT_VERSION);
    expect(result.state.log).toEqual({
      '2026-10-12': { sleep: 1 },
      '2026-10-13': { exercise: 1 },
      '2026-10-19': { exercise: 1, read: 1 },
    });
    // The pretend date leaves the save in v5 (T17).
    expect('dayOffset' in result.state).toBe(false);
    expect(result.state.pet).toEqual(START_PET);
    expect(result.state.removed).toEqual([]);
  });

  it('loads a current save as is', () => {
    const state = createInitialState();
    expect(loadSave(JSON.stringify(state))).toEqual({ kind: 'loaded', state, upgradedFrom: null });
  });

  it.each([
    ['not JSON', '{oops'],
    ['not an object', '"hello"'],
    ['no version', JSON.stringify({ habits: [] })],
    ['a version with no upgrade step', JSON.stringify({ ...v3, version: 1 })],
    ['a v3 save missing its habits', JSON.stringify({ ...v3, habits: undefined })],
    ['a v8 save missing its pet', JSON.stringify({ ...v8, pet: undefined })],
    [
      'a current save missing its targets',
      JSON.stringify({ ...createInitialState(), targets: undefined }),
    ],
    [
      'a current save missing its slips',
      JSON.stringify({ ...createInitialState(), slips: undefined }),
    ],
  ])('an unreadable save (%s) is returned whole for the backup slot', (_, raw) => {
    expect(loadSave(raw)).toEqual({ kind: 'unreadable', raw });
  });

  it('a save from a newer app is left alone', () => {
    const raw = JSON.stringify({ ...createInitialState(), version: CURRENT_VERSION + 1 });
    expect(loadSave(raw)).toEqual({ kind: 'newer', version: CURRENT_VERSION + 1 });
  });

  it('upgrading is the only path: no save is ever dropped without a backup', () => {
    const inputs = ['', '{}', 'null', JSON.stringify(v3), JSON.stringify({ version: 99 })];
    for (const raw of inputs) expect(loadSave(raw).kind).not.toBe('empty');
  });

  it('each backup gets its own key, so a backup is never overwritten', () => {
    const a = backupKey('k', new Date('2026-10-19T10:00:00Z'));
    const b = backupKey('k', new Date('2026-10-19T10:00:01Z'));
    expect(a).not.toBe(b);
    expect(a.startsWith('k/backup/')).toBe(true);
  });
});
