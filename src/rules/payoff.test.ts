// P2-14 (#85): the Activity Bar payoff rules. Top risks: moments on app open or a Rest day, the
// affection purr more than once, and reduced motion still moving.

import { describe, expect, it } from '@jest/globals';

import { tuning } from '@/config/tuning';
import { justFilled } from '@/components/activityBarText';
import { EVERY_DAY, type Habit } from './habits';
import { affectionDue, finishedCount, momentCaption, momentPlan, pickMoment } from './payoff';

const m = tuning.pet.moments;
const HOP = 1000;

describe('when a full bar fires a moment (AC 2)', () => {
  it('only on an upward move to full', () => {
    expect(justFilled(0.66, 1, false)).toBe(true);
    // Opening the app on a full bar: no move, no moment.
    expect(justFilled(1, 1, false)).toBe(false);
    // A Rest day is full without earning anything.
    expect(justFilled(0, 1, true)).toBe(false);
  });

  it('undo below full then refill fires again', () => {
    expect(justFilled(1, 0.66, false)).toBe(false);
    expect(justFilled(0.66, 1, false)).toBe(true);
  });
});

describe('picking a moment (AC 2)', () => {
  it('each of the three, evenly', () => {
    expect(pickMoment(() => 0)).toBe('eat');
    expect(pickMoment(() => 0.5)).toBe('pounce');
    expect(pickMoment(() => 0.99)).toBe('purr');
  });
});

describe('caption', () => {
  it('names what you did', () => {
    expect(momentCaption('eat', 3)).toBe('You finished 3 habits. Neko ate every bite.');
    expect(momentCaption('purr', 1)).toBe('You finished 1 habit. Neko is purring.');
  });

  it('counts finished habits only', () => {
    const h = (id: string, timesPerDay?: number): Habit => ({
      id,
      name: id,
      color: 'habit1',
      schedule: { kind: 'specificDays', days: EVERY_DAY },
      ...(timesPerDay ? { timesPerDay } : {}),
    });
    const log = { '2026-10-20': { a: 1, b: 2, c: 1 } };
    expect(finishedCount([h('a'), h('b', 3), h('c')], log, '2026-10-20')).toBe(2);
  });
});

describe('affection purr (AC 5)', () => {
  const over = m.affectionLoveAbove + 1;
  it('Love over the line, awake, not shown yet', () => {
    expect(affectionDue(over, { shownThisOpen: false, awake: true })).toBe(true);
  });

  it('never twice, never asleep, never at or under the line', () => {
    expect(affectionDue(over, { shownThisOpen: true, awake: true })).toBe(false);
    expect(affectionDue(over, { shownThisOpen: false, awake: false })).toBe(false);
    expect(affectionDue(m.affectionLoveAbove, { shownThisOpen: false, awake: true })).toBe(false);
  });
});

describe('moment plans', () => {
  const plan = (kind: 'eat' | 'pounce' | 'purr', reduceMotion = false) =>
    momentPlan(kind, { reduceMotion, hopMs: HOP });

  it('purr: eyes shut through 3 hearts, each starting before the last fades', () => {
    const p = plan('purr');
    expect(p.hearts).toHaveLength(m.purrHearts);
    for (let i = 1; i < p.hearts.length; i++) {
      expect(p.hearts[i]! - p.hearts[i - 1]!).toBeLessThan(m.heartMs);
    }
    expect(p.eyesShut).toEqual([[0, p.hearts[p.hearts.length - 1]! + m.heartMs]]);
    expect(p.prop).toBeUndefined();
  });

  it('eat: the bowl comes in, then eyes close with one heart', () => {
    const p = plan('eat');
    expect(p.prop?.kind).toBe('bowl');
    expect(p.hearts).toHaveLength(1);
    expect(p.eyesShut[0]![0]).toBeGreaterThan(m.bowlInMs);
    expect(p.hearts[0]).toBe(p.eyesShut[0]![0]);
  });

  it('pounce: the toy lands, the pet hops, then eyes close with one heart', () => {
    const p = plan('pounce');
    expect(p.prop?.kind).toBe('toy');
    expect(p.hopAt).toBeGreaterThanOrEqual(m.toyInMs);
    expect(p.eyesShut[0]![0]).toBeGreaterThanOrEqual(p.hopAt! + HOP);
    expect(p.hearts).toEqual([p.eyesShut[0]![0]]);
  });

  it('every moment ends after its prop is gone', () => {
    for (const kind of ['eat', 'pounce', 'purr'] as const) {
      const p = plan(kind);
      if (p.prop) expect(p.totalMs).toBeGreaterThan(p.prop.outAt + m.propOutMs - 1);
    }
  });

  it('reduced motion keeps eyes and hearts but drops movement and the hop (AC 6)', () => {
    for (const kind of ['eat', 'pounce', 'purr'] as const) {
      const p = plan(kind, true);
      expect(p.moves).toBe(false);
      expect(p.hopAt).toBeUndefined();
      expect(p.hearts.length).toBeGreaterThan(0);
      expect(p.eyesShut.length).toBeGreaterThan(0);
    }
  });
});
