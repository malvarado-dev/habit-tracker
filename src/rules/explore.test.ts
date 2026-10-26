// P2-16 (#87): Explore. Top risks: Coins paid twice or rerolled, the button offered more than
// once a day, and a seam in the scrolling layers.

import { describe, expect, it } from '@jest/globals';

import { tuning } from '@/config/tuning';
import { createInitialState, trackerReducer } from '@/features/tracker/state';
import {
  canExplore,
  exploreCoins,
  exploreLayout,
  exploreReward,
  exploreTint,
  isExploring,
  rewardToReveal,
  START_EXPLORE,
} from './explore';

const x = tuning.explore;
const D1 = '2026-10-20';
const D2 = '2026-10-21';
const D3 = '2026-10-22';
const send = (date: string) => (s: ReturnType<typeof createInitialState>) =>
  trackerReducer(s, { type: 'sendExploring', date }, 'design1');

describe('when Explore is offered (AC 1)', () => {
  it('only on a full bar, once a day', () => {
    expect(canExplore(START_EXPLORE, D1, false)).toBe(false);
    expect(canExplore(START_EXPLORE, D1, true)).toBe(true);
    const sent = send(D1)(createInitialState()).explore;
    expect(isExploring(sent, D1)).toBe(true);
    expect(canExplore(sent, D1, true)).toBe(false);
    expect(canExplore(sent, D2, true)).toBe(true);
  });

  it('sending twice on one day changes nothing', () => {
    const once = send(D1)(createInitialState());
    expect(send(D1)(once)).toBe(once);
  });
});

describe('the reward (AC 4)', () => {
  it('is in range and the same every time for a day', () => {
    for (const d of [D1, D2, D3, '2027-01-01']) {
      const n = exploreReward(d);
      expect(n).toBeGreaterThanOrEqual(x.coinsMin);
      expect(n).toBeLessThanOrEqual(x.coinsMax);
      expect(exploreReward(d)).toBe(n);
    }
  });

  it('counts once the day is over, never while the pet is still out, and never twice', () => {
    const e = send(D1)(createInitialState()).explore;
    expect(exploreCoins(e, D1)).toBe(0);
    expect(exploreCoins(e, D2)).toBe(exploreReward(D1));
    expect(exploreCoins(e, D3)).toBe(exploreReward(D1));
  });

  it('is revealed once', () => {
    let s = send(D1)(createInitialState());
    expect(rewardToReveal(s.explore, D1)).toBeNull();
    expect(rewardToReveal(s.explore, D2)).toBe(D1);
    s = trackerReducer(s, { type: 'markExploreSeen', date: D1 }, 'design1');
    expect(rewardToReveal(s.explore, D2)).toBeNull();
  });
});

describe('the scrolling layers (AC 2)', () => {
  const l = exploreLayout(400, 340);

  it('fit the scene height, with the far layer raised', () => {
    expect(l.top.far).toBe(0);
    expect(l.top.near).toBeCloseTo(x.farRaise * l.scale);
    expect(l.top.near + l.height).toBeCloseTo(340);
  });

  it('always have enough tiles to cover the screen while one scrolls off', () => {
    expect(l.tileWidth * (l.copies - 1)).toBeGreaterThanOrEqual(400);
    const narrow = exploreLayout(2000, 100);
    expect(narrow.tileWidth * (narrow.copies - 1)).toBeGreaterThanOrEqual(2000);
  });

  it('near scrolls fastest and far slowest', () => {
    expect(l.loopMs.near).toBeLessThan(l.loopMs.mid);
    expect(l.loopMs.mid).toBeLessThan(l.loopMs.far);
  });
});

describe('the tint (AC 3)', () => {
  it('none by day, deeper at night', () => {
    expect(exploreTint('day').opacity).toBe(0);
    expect(exploreTint('night').opacity).toBeGreaterThan(exploreTint('dusk').opacity);
  });
});
