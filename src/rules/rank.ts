// App rules live here in plain TypeScript, with no screens attached (Technical Design D-07).
// Rank cutoffs live in the tuning file (src/config/tuning.ts). One set for everyone; modes
// were removed 2026-10-18.
import { tuning } from '@/config/tuning';

export type Rank = 'S' | 'A' | 'B' | 'C';

/** Turns a daily score (0 to 1) into a rank. */
export function getRank(score: number): Rank {
  if (!Number.isFinite(score) || score < 0 || score > 1) {
    throw new RangeError(`Score must be between 0 and 1, got ${score}`);
  }
  const { S, A, B } = tuning.rank.cutoffs;
  if (score >= S) return 'S';
  if (score >= A) return 'A';
  if (score >= B) return 'B';
  return 'C';
}
