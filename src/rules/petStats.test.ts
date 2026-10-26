// P2-13 (#84): Love and Confidence worked out from the log. Top risks: farming stats by tapping
// on and off, stats drifting from the log after a History edit, and values past 0 or 100.

import { describe, expect, it } from '@jest/globals';

import { tuning } from '@/config/tuning';
import { HABIT_CATEGORIES } from '@/features/habits/premadeHabits';
import { EVERY_DAY, type Habit, type LogCounts } from './habits';
import { adjustFor, earnedStats, petStats, statForCategory, statForHabit } from './petStats';

const s = tuning.pet.stats;
const DAY = '2026-10-20';
const NEXT = '2026-10-21';

const habit = (id: string, name: string, extra: Partial<Habit> = {}): Habit => ({
  id,
  name,
  schedule: { kind: 'specificDays', days: EVERY_DAY },
  color: 'habit1',
  ...extra,
});

// Two Confidence habits and one Love habit, all due daily. Each day's target is saved at 3, so
// every log is one notch.
const SLEEP = habit('sleep', 'Sleep'); // Daily Maintenance: Confidence
const READ = habit('read', 'Read'); // Growth & Productivity: Confidence
const FAMILY = habit('family', 'Family Time'); // Social & Relationships: Love

function stateWith(log: LogCounts, extra: { removed?: Habit[]; habits?: Habit[] } = {}) {
  const days = Object.keys(log);
  return {
    habits: extra.habits ?? [SLEEP, READ, FAMILY],
    removed: extra.removed ?? [],
    log,
    targets: Object.fromEntries(days.map((d) => [d, 3])),
    locked: {},
    lockedThrough: null,
    pet: { loveAdjust: 0, confidenceAdjust: 0 },
  };
}

const START = { love: s.startLove, confidence: s.startConfidence };

describe('which stat a habit raises', () => {
  it('every category has a stat', () => {
    for (const c of HABIT_CATEGORIES) expect(['love', 'confidence']).toContain(statForCategory(c));
  });

  it('premade habits use their category, matched by name in any case', () => {
    expect(statForHabit({ name: 'Brush Teeth' })).toBe('confidence');
    expect(statForHabit({ name: 'Meditate' })).toBe('confidence');
    expect(statForHabit({ name: 'study' })).toBe('confidence');
    expect(statForHabit({ name: 'Family Time' })).toBe('love');
    expect(statForHabit({ name: 'Gaming' })).toBe('love');
  });

  it('custom habits use the custom stat', () => {
    expect(statForHabit({ name: 'Water the plants' })).toBe(s.customHabit);
  });
});

describe('petStats', () => {
  it('nothing logged is the start values', () => {
    expect(petStats(stateWith({}))).toEqual(START);
  });

  it('a finished habit raises its stat, and one notch raises both (AC 1, 2)', () => {
    expect(petStats(stateWith({ [DAY]: { family: 1 } }))).toEqual({
      love: s.startLove + s.perHabit + s.perNotch,
      confidence: s.startConfidence + s.perNotch,
    });
  });

  it('a full bar adds every notch to both', () => {
    const notches = tuning.activityBar.notches.length;
    expect(petStats(stateWith({ [DAY]: { sleep: 1, read: 1, family: 1 } }))).toEqual({
      love: s.startLove + s.perHabit + notches * s.perNotch,
      confidence: s.startConfidence + 2 * s.perHabit + notches * s.perNotch,
    });
  });

  it('a habit only counts once it reaches its times per day', () => {
    const twice = habit('sleep', 'Sleep', { timesPerDay: 2 });
    const once = stateWith({ [DAY]: { sleep: 1 } }, { habits: [twice, READ, FAMILY] });
    const done = stateWith({ [DAY]: { sleep: 2 } }, { habits: [twice, READ, FAMILY] });
    // Both logs fill the bar; only the second finishes the habit.
    expect(earnedStats(done).confidence - earnedStats(once).confidence).toBe(
      s.perHabit + s.perNotch,
    );
  });

  it('undoing a log takes the points back, so tapping on and off earns nothing (AC 1)', () => {
    const before = petStats(stateWith({ [DAY]: {} }));
    expect(petStats(stateWith({ [DAY]: { sleep: 0 } }))).toEqual(before);
  });

  it('a past day fixed in History counts the same as today (AC 3)', () => {
    const today = earnedStats(stateWith({ [NEXT]: { sleep: 1 } }));
    const fixed = earnedStats(stateWith({ [DAY]: { sleep: 1 }, [NEXT]: { sleep: 1 } }));
    expect(fixed.confidence).toBe(2 * today.confidence);
  });

  it('a removed habit still counts on the days it was active', () => {
    const gone = { ...READ, removedOn: NEXT };
    const state = stateWith({ [DAY]: { read: 1 } }, { habits: [SLEEP, FAMILY], removed: [gone] });
    expect(earnedStats(state).confidence).toBe(s.perHabit + s.perNotch);
  });

  it('never goes below 0 or above 100 (AC 4)', () => {
    const low = { ...stateWith({}), pet: { loveAdjust: -500, confidenceAdjust: -500 } };
    expect(petStats(low)).toEqual({ love: 0, confidence: 0 });
    const full = { sleep: 1, read: 1, family: 1 };
    const log = Object.fromEntries(
      Array.from({ length: 30 }, (_, i) => [`2026-09-${String(i + 1).padStart(2, '0')}`, full]),
    );
    expect(petStats(stateWith(log))).toEqual({ love: 100, confidence: 100 });
  });
});

describe('Test tools nudges', () => {
  it('a nudge makes the stat show the asked value', () => {
    const base = stateWith({ [DAY]: { sleep: 1 } });
    const confidenceAdjust = adjustFor('confidence', 70, base);
    expect(petStats({ ...base, pet: { loveAdjust: 0, confidenceAdjust } }).confidence).toBe(70);
  });

  it('asked values are clamped to 0 to 100', () => {
    const base = stateWith({});
    const high = adjustFor('love', 140, base);
    expect(petStats({ ...base, pet: { loveAdjust: high, confidenceAdjust: 0 } }).love).toBe(100);
  });
});
