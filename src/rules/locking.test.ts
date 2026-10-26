import { describe, expect, it } from '@jest/globals';
import { createInitialState, trackerReducer, type TrackerState } from '@/features/tracker/state';
import { historyDay, isLocked, lastLockedDay, lockDays } from './locking';

// Pretend dates. Monday 2026-10-19 is "today": the 19th, 18th, and 17th are open.
const TODAY = '2026-10-19';
const OPEN_OLDEST = '2026-10-17';
const LOCKED = '2026-10-16';

function withLog(log: TrackerState['log']): TrackerState {
  return { ...createInitialState(), log };
}

// Sleep, Diet, and Wellbeing are due every day: 3 possible, 2 fill the bar.
const filled = { sleep: 1, diet: 1 };
const short = { sleep: 1 };

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
  it('saves a check-in with its logs and target when the day locks', () => {
    const state = lockDays(withLog({ [LOCKED]: filled }), TODAY);
    expect(state.lockedThrough).toBe(LOCKED);
    expect(state.locked[LOCKED]).toEqual({ outcome: 'checkIn', logs: 2, target: 2 });
  });

  it('a day that fell short saves no check-in; a day with no logs has no entry', () => {
    const state = lockDays(withLog({ [LOCKED]: short, '2026-10-15': {} }), TODAY);
    expect(state.locked[LOCKED]).toEqual({ outcome: 'none', logs: 1, target: 2 });
    expect(state.locked['2026-10-15']).toBeUndefined();
    expect(historyDay(state, '2026-10-15').outcome).toBe('none');
  });

  it("uses the day's saved target over the live habits", () => {
    const state = lockDays({ ...withLog({ [LOCKED]: short }), targets: { [LOCKED]: 1 } }, TODAY);
    expect(state.locked[LOCKED]?.outcome).toBe('checkIn');
  });

  it('never locks an open day', () => {
    const state = lockDays(withLog({ [OPEN_OLDEST]: filled }), TODAY);
    expect(state.locked[OPEN_OLDEST]).toBeUndefined();
  });

  it('does nothing when already locked through today, and returns the same state', () => {
    const once = lockDays(withLog({ [LOCKED]: filled }), TODAY);
    expect(lockDays(once, TODAY)).toBe(once);
  });

  it('a locked result is never recomputed on a later lock', () => {
    const once = lockDays(withLog({ [LOCKED]: filled }), TODAY);
    const tampered = { ...once, log: { ...once.log, [LOCKED]: {} } };
    expect(lockDays(tampered, '2026-10-25').locked[LOCKED]?.outcome).toBe('checkIn');
  });

  it('when midnight passes, the day that falls out of the window locks', () => {
    const before = lockDays(withLog({ [OPEN_OLDEST]: filled }), TODAY);
    expect(before.locked[OPEN_OLDEST]).toBeUndefined();
    const after = lockDays(before, '2026-10-20');
    expect(after.locked[OPEN_OLDEST]?.outcome).toBe('checkIn');
  });
});

describe('a locked day never changes', () => {
  const locked = () => lockDays(withLog({ [LOCKED]: short }), TODAY);

  it('logs and undos on a locked day are ignored', () => {
    const state = locked();
    expect(trackerReducer(state, { type: 'logHabit', date: LOCKED, habitId: 'diet' })).toBe(state);
    expect(trackerReducer(state, { type: 'undoLog', date: LOCKED, habitId: 'sleep' })).toBe(state);
    // Even a day with no data can't be filled in once it's locked.
    expect(trackerReducer(state, { type: 'logHabit', date: '2026-10-01', habitId: 'diet' })).toBe(
      state,
    );
  });

  it('editing a schedule, renaming, or removing a habit leaves the locked day as it was', () => {
    let state = locked();
    state = trackerReducer(state, {
      type: 'setSchedule',
      habitId: 'sleep',
      schedule: { kind: 'anyDays' },
    });
    state = trackerReducer(state, { type: 'renameHabit', habitId: 'diet', name: 'Food' });
    state = trackerReducer(state, { type: 'removeHabit', habitId: 'wellbeing', date: TODAY });
    expect(historyDay(state, LOCKED)).toEqual(locked().locked[LOCKED]);
  });

  it('open days still change on logs', () => {
    let state = lockDays(withLog({ [TODAY]: short }), TODAY);
    expect(historyDay(state, TODAY).outcome).toBe('none');
    state = trackerReducer(state, { type: 'logHabit', date: TODAY, habitId: 'diet' });
    expect(historyDay(state, TODAY)).toEqual({ outcome: 'checkIn', logs: 2, target: 2 });
  });
});
