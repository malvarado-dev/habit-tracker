// When the end-of-day rank moment plays (SPEC-00, T15). Plain rules, no screens.
// It plays once every due habit is scored, and replays only when a later change raises the
// rank (decided 2026-10-19). Never on app open: a day that was already finished when the
// app opened counts as already played. A Rest day has no rank, so it never plays.

import type { Rank } from './rank';
import type { DailyResult } from './scoring';
import { getRank } from './rank';

const ORDER: Record<Rank, number> = { C: 0, B: 1, A: 2, S: 3 };

/** The finished day's rank, or null while something due is still To do, or on a Rest day. */
export function finishedRank(result: DailyResult): Rank | null {
  if (!result.isComplete || result.isRestDay || result.score === null) return null;
  return getRank(result.score);
}

/** On app open (or the first look at a day), a finished day counts as already played. */
export function initialPlayed(result: DailyResult): Rank | null {
  return finishedRank(result);
}

/** The rank to celebrate now, or null. `played` is the best rank already celebrated today. */
export function rankToPlay(result: DailyResult, played: Rank | null): Rank | null {
  const rank = finishedRank(result);
  if (rank === null) return null;
  if (played !== null && ORDER[rank] <= ORDER[played]) return null;
  return rank;
}

/**
 * Coming back to a screen that was hidden (T23): whatever was finished meanwhile, for example
 * on the Day screen, counts as already played, so returning never replays it.
 */
export function playedOnReturn(result: DailyResult, played: Rank | null): Rank | null {
  const rank = finishedRank(result);
  if (rank === null) return played;
  if (played === null || ORDER[rank] > ORDER[played]) return rank;
  return played;
}
