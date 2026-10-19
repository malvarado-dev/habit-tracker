import { describe, expect, it } from '@jest/globals';
import { backupKey, CURRENT_VERSION, loadSave } from './save';
import { createInitialState, DEFAULT_HABITS } from './state';

// A real-looking v3 save: a custom habit, a changed goal, and check-ins across two weeks.
const v3 = {
  version: 3,
  habits: [
    ...DEFAULT_HABITS,
    {
      id: 'read',
      name: 'Reading',
      goal: { kind: 'specificDays', days: [0, 2, 4] },
      color: 'habit2',
    },
  ],
  log: {
    '2026-10-12': { sleep: 'NailedIt', read: 'NotToday' },
    '2026-10-13': { diet: 'Started' },
    '2026-10-18': {},
    '2026-10-19': { exercise: 'OnTrack', read: 'NailedIt' },
  },
  dayOffset: 2,
};

describe('loadSave', () => {
  it('nothing saved means an empty start', () => {
    expect(loadSave(null)).toEqual({ kind: 'empty' });
  });

  it('upgrades v3 through v4 to v5 keeping every habit and check-in exactly as it was', () => {
    const result = loadSave(JSON.stringify(v3));
    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') return;
    expect(result.upgradedFrom).toBe(3);
    expect(result.state.version).toBe(CURRENT_VERSION);
    expect(result.state.habits).toEqual(v3.habits);
    expect(result.state.log).toEqual(v3.log);
    // The pretend date leaves the save in v5 (T17).
    expect('dayOffset' in result.state).toBe(false);
    expect(result.state.locked).toEqual({});
    expect(result.state.lockedThrough).toBeNull();
  });

  it('upgrades v5 to v6 keeping everything, with no added date on existing habits (#52)', () => {
    const v5 = {
      version: 5,
      habits: DEFAULT_HABITS,
      log: { '2026-10-19': { sleep: 'NailedIt' } },
      locked: {},
      lockedThrough: '2026-10-16',
    };
    const result = loadSave(JSON.stringify(v5));
    expect(result).toEqual({ kind: 'loaded', state: { ...v5, version: 6 }, upgradedFrom: 5 });
    if (result.kind === 'loaded') {
      expect(result.state.habits.every((h) => h.addedOn === undefined)).toBe(true);
    }
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
    [
      'a current save missing locked days',
      JSON.stringify({ ...createInitialState(), locked: undefined }),
    ],
  ])('an unreadable save (%s) is returned whole for the backup slot', (_, raw) => {
    expect(loadSave(raw)).toEqual({ kind: 'unreadable', raw });
  });

  it('a save from a newer app is left alone', () => {
    const raw = JSON.stringify({ ...createInitialState(), version: CURRENT_VERSION + 1 });
    expect(loadSave(raw)).toEqual({ kind: 'newer', version: CURRENT_VERSION + 1 });
  });

  it('upgrading is the only path: no save is ever dropped without a backup', () => {
    // Every non-empty input ends as loaded, newer, or unreadable (backed up). Never silently empty.
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
