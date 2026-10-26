// P2-15 (#86): the Heal quest. Top risks: counting days from before Accept, claiming twice, and
// the reward reaching the stats more than once.

import { describe, expect, it } from '@jest/globals';

import { tuning } from '@/config/tuning';
import { createInitialState, trackerReducer, type TrackerState } from '@/features/tracker/state';
import { addDays } from './dates';
import { petStats } from './petStats';
import { healCheckIns, healStatus, isBandaged } from './quest';

const q = tuning.quest.heal;
const START = '2026-10-10';
// The default habits; logging all of them fills the bar for that day.
const fill = (state: TrackerState, date: string) =>
  trackerReducer(state, { type: 'fillDay', date }, 'design1');
const run = (state: TrackerState, ...actions: Parameters<typeof trackerReducer>[1][]) =>
  actions.reduce((s, a) => trackerReducer(s, a, 'design1'), state);
const fresh = () => createInitialState(START);

describe('Heal quest progress (AC 2, 3)', () => {
  it('is new until accepted, and counts nothing before then', () => {
    const s = fill(fresh(), START);
    expect(healStatus(s, START)).toBe('new');
    expect(healCheckIns(s, START)).toBe(0);
  });

  it('counts the accept day itself when its bar is full', () => {
    const s = run(fill(fresh(), START), { type: 'acceptQuest', date: START });
    expect(healCheckIns(s, START)).toBe(1);
    expect(healStatus(s, START)).toBe('active');
  });

  it('days before the accept day never count', () => {
    let s = fill(fresh(), START);
    const later = addDays(START, 2);
    s = run(s, { type: 'acceptQuest', date: later });
    expect(healCheckIns(s, later)).toBe(0);
  });

  it('a past day filled later (History) counts if it is on or after the accept day', () => {
    let s = run(fresh(), { type: 'acceptQuest', date: START });
    const today = addDays(START, 1);
    expect(healCheckIns(s, today)).toBe(0);
    s = fill(s, START);
    expect(healCheckIns(s, today)).toBe(1);
  });

  it('undoing a fill takes it back off the count', () => {
    let s = run(fill(fresh(), START), { type: 'acceptQuest', date: START });
    s = run(s, { type: 'undoLog', date: START, habitId: 'sleep' });
    s = run(s, { type: 'undoLog', date: START, habitId: 'diet' });
    s = run(s, { type: 'undoLog', date: START, habitId: 'wellbeing' });
    expect(healCheckIns(s, START)).toBe(0);
  });
});

describe('Claim (AC 4)', () => {
  const doneOn = addDays(START, q.goal - 1);
  const done = () => {
    let s = run(fresh(), { type: 'acceptQuest', date: START });
    for (let i = 0; i < q.goal; i++) s = fill(s, addDays(START, i));
    return s;
  };

  it('Claim only works once the goal is reached', () => {
    const early = run(
      fresh(),
      { type: 'acceptQuest', date: START },
      { type: 'claimQuest', date: START },
    );
    expect(early.quests.heal.claimedOn).toBeNull();
    const s = done();
    expect(healStatus(s, doneOn)).toBe('done');
    expect(run(s, { type: 'claimQuest', date: doneOn }).quests.heal.claimedOn).toBe(doneOn);
  });

  it('removes the bandages and adds the reward once', () => {
    const s = done();
    const before = petStats(s);
    const claimed = run(s, { type: 'claimQuest', date: doneOn });
    const twice = run(claimed, { type: 'claimQuest', date: doneOn });
    expect(isBandaged(s.quests)).toBe(true);
    expect(isBandaged(claimed.quests)).toBe(false);
    expect(petStats(claimed).love).toBe(Math.min(100, before.love + q.rewardLove));
    expect(petStats(twice)).toEqual(petStats(claimed));
    expect(healStatus(claimed, doneOn)).toBe('claimed');
  });
});

describe('Test tools (AC 6)', () => {
  it('the stepper jumps to any count and accepts the quest if needed', () => {
    const s = run(fresh(), { type: 'setHealCheckIns', count: 5, date: START });
    expect(s.quests.heal.acceptedOn).toBe(START);
    expect(healCheckIns(s, START)).toBe(5);
    expect(healCheckIns(run(s, { type: 'setHealCheckIns', count: 99, date: START }), START)).toBe(
      q.goal,
    );
  });

  it('reset starts the quest over', () => {
    const s = run(
      fresh(),
      { type: 'setHealCheckIns', count: 7, date: START },
      { type: 'resetQuest' },
    );
    expect(healStatus(s, START)).toBe('new');
  });
});
