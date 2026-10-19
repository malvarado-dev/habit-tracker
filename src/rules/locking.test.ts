import { describe, expect, it } from '@jest/globals';
import { createInitialState, trackerReducer, type TrackerState } from '@/features/tracker/state';
import { getDailyResult } from './scoring';
import { historyDay, isLocked, lastLockedDay, lockDays } from './locking';

// Pretend dates. Monday 2026-10-19 is "today": the 19th, 18th, and 17th are open.
const TODAY = '2026-10-19';
const OPEN_OLDEST = '2026-10-17';
const LOCKED = '2026-10-16';

function withLog(log: TrackerState['log']): TrackerState {
  return { ...createInitialState(), log };
}

const allNailed = { sleep: 'NailedIt', diet: 'NailedIt', wellbeing: 'NailedIt' } as const;

describe('which days are open', () => {
  it('today and the 2 days before are open; older days are locked', () => {
    const through = lastLockedDay(TODAY);
    expect(through).toBe(LOCKED);
    expect(isLocked(TODAY, through)).toBe(false);
    expect(isLocked(OPEN_OLDEST, through)).toBe(false);
    expect(isLocked(LOCKED, through)).toBe(true);
  });

  it('nothing is locked before the first lock runs', () => {
    expect(isLocked('2000-01-01', null)).toBe(false);
  });
});

describe('lockDays', () => {
  it('saves the rank and stars of a day when it locks', () => {
    const state = lockDays(withLog({ [LOCKED]: allNailed }), TODAY);
    expect(state.lockedThrough).toBe(LOCKED);
    expect(state.locked[LOCKED]).toEqual({
      outcome: 'rank',
      rank: 'S',
      earnedStars: 9,
      possibleStars: 9,
    });
  });

  it('saves a Rest day and gives a day with no check-in no entry', () => {
    const rest = { sleep: 'NotToday', diet: 'NotToday', wellbeing: 'NotToday' } as const;
    const state = lockDays(withLog({ [LOCKED]: rest, '2026-10-15': {} }), TODAY);
    expect(state.locked[LOCKED]?.outcome).toBe('rest');
    expect(state.locked['2026-10-15']).toBeUndefined();
    expect(historyDay(state, '2026-10-15').outcome).toBe('none');
    expect(historyDay(state, '2026-10-14').outcome).toBe('none');
  });

  it('never locks an open day', () => {
    const state = lockDays(withLog({ [OPEN_OLDEST]: allNailed }), TODAY);
    expect(state.locked[OPEN_OLDEST]).toBeUndefined();
  });

  it('does nothing when already locked through today, and returns the same state', () => {
    const once = lockDays(withLog({ [LOCKED]: allNailed }), TODAY);
    expect(lockDays(once, TODAY)).toBe(once);
  });

  it('a locked result is never recomputed on a later lock', () => {
    const once = lockDays(withLog({ [LOCKED]: allNailed }), TODAY);
    const tampered = { ...once, log: { ...once.log, [LOCKED]: {} } };
    expect(lockDays(tampered, '2026-10-25').locked[LOCKED]?.rank).toBe('S');
  });

  it('when midnight passes, the day that falls out of the window locks', () => {
    const before = lockDays(withLog({ [OPEN_OLDEST]: allNailed }), TODAY);
    expect(before.locked[OPEN_OLDEST]).toBeUndefined();
    const after = lockDays(before, '2026-10-20');
    expect(after.locked[OPEN_OLDEST]?.rank).toBe('S');
  });
});

describe('a locked day never changes', () => {
  const locked = () => lockDays(withLog({ [LOCKED]: allNailed }), TODAY);

  it('taps and swipes on a locked day are ignored', () => {
    const state = locked();
    expect(trackerReducer(state, { type: 'tapHabit', date: LOCKED, habitId: 'diet' })).toBe(state);
    expect(
      trackerReducer(state, {
        type: 'setCheckIn',
        date: LOCKED,
        habitId: 'diet',
        checkIn: undefined,
      }),
    ).toBe(state);
    // Even a day with no data can't be filled in once it's locked.
    expect(trackerReducer(state, { type: 'tapHabit', date: '2026-10-01', habitId: 'diet' })).toBe(
      state,
    );
  });

  it('editing a goal, renaming, or removing a habit leaves the locked day as it was', () => {
    let state = locked();
    state = trackerReducer(state, {
      type: 'setGoal',
      habitId: 'sleep',
      goal: { kind: 'anyDays', timesPerWeek: 1 },
    });
    state = trackerReducer(state, { type: 'renameHabit', habitId: 'diet', name: 'Food' });
    state = trackerReducer(state, { type: 'removeHabit', habitId: 'wellbeing' });
    expect(historyDay(state, LOCKED)).toEqual(locked().locked[LOCKED]);
  });

  it('open days still change on edits', () => {
    let state = lockDays(withLog({ [TODAY]: allNailed }), TODAY);
    expect(historyDay(state, TODAY).rank).toBe('S');
    state = trackerReducer(state, { type: 'tapHabit', date: TODAY, habitId: 'diet' });
    expect(historyDay(state, TODAY).earnedStars).toBe(6);
  });
});

describe('editing an open day updates later open days in the same week', () => {
  // Sun 10-18 and Mon 10-19 are open and in the same week. A Run habit planned on 1 day
  // (Monday) is due Monday until it's done earlier in the week.
  const run = {
    id: 'run',
    name: 'Run',
    goal: { kind: 'specificDays', days: [0] },
    color: 'habit1',
  };

  it('scoring Run on Sunday means it is no longer due on Monday', () => {
    const base: TrackerState = { ...createInitialState(), habits: [run] as TrackerState['habits'] };
    expect(historyDay(base, TODAY).outcome).toBe('none');
    const monday = trackerReducer(base, { type: 'tapHabit', date: TODAY, habitId: 'run' });
    expect(getDailyResult(monday.habits, monday.log, TODAY).dueCount).toBe(1);
    const sunday = trackerReducer(monday, {
      type: 'setCheckIn',
      date: '2026-10-18',
      habitId: 'run',
      checkIn: 'NailedIt',
    });
    // Monday is no longer due; Monday's Started now counts only as an optional bonus.
    expect(getDailyResult(sunday.habits, sunday.log, TODAY).dueCount).toBe(0);
  });
});
