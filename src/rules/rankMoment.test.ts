import { describe, expect, it } from '@jest/globals';

import type { DailyResult } from './scoring';
import { finishedRank, initialPlayed, rankToPlay } from './rankMoment';

const day = (over: Partial<DailyResult>): DailyResult => ({
  dueCount: 4,
  checkedInCount: 4,
  earnedStars: 12,
  possibleStars: 12,
  hasCheckIn: true,
  isComplete: true,
  isRestDay: false,
  score: 1,
  ...over,
});

describe('acceptance: rank moment timing (T15)', () => {
  it.each([
    [0.95, 'S'],
    [0.8, 'A'],
    [0.6, 'B'],
    [0.2, 'C'],
  ] as const)(
    'a finished day at %f celebrates %s; C still celebrates showing up',
    (score, rank) => {
      expect(rankToPlay(day({ score }), null)).toBe(rank);
    },
  );

  it('waits until every due habit is scored', () => {
    expect(rankToPlay(day({ isComplete: false, checkedInCount: 3 }), null)).toBeNull();
  });

  it('never plays on a Rest day', () => {
    expect(rankToPlay(day({ isRestDay: true, score: null }), null)).toBeNull();
  });

  it('never plays on app open for a day that was already finished', () => {
    const finished = day({ score: 0.8 });
    expect(rankToPlay(finished, initialPlayed(finished))).toBeNull();
    expect(initialPlayed(day({ isComplete: false }))).toBeNull();
  });

  it('replays only when a change raises the rank', () => {
    expect(rankToPlay(day({ score: 0.95 }), 'A')).toBe('S');
    expect(rankToPlay(day({ score: 0.6 }), 'A')).toBeNull();
    expect(rankToPlay(day({ score: 0.8 }), 'A')).toBeNull();
  });

  it('finishedRank is null until the day is done', () => {
    expect(finishedRank(day({ isComplete: false }))).toBeNull();
    expect(finishedRank(day({ score: 0.5 }))).toBe('B');
  });
});
