// App rules live here in plain TypeScript, with no screens attached (Technical Design D-07).
// Rank cutoffs come from SPEC-00. They are tuning knobs for the prototype.

export type Mode = 'Beginner' | 'Challenger' | 'Pro';
export type Rank = 'S' | 'A' | 'B' | 'C';

/** Lowest daily score (0 to 1) needed for each rank, by mode. Anything lower is C. */
export const RANK_CUTOFFS: Record<Mode, { S: number; A: number; B: number }> = {
  Beginner: { S: 0.8, A: 0.6, B: 0.35 },
  Challenger: { S: 0.9, A: 0.75, B: 0.5 },
  Pro: { S: 0.95, A: 0.85, B: 0.65 },
};

export const DEFAULT_MODE: Mode = 'Beginner';

/** Turns a daily score (stars earned divided by stars possible) into a rank. */
export function getRank(score: number, mode: Mode): Rank {
  if (!Number.isFinite(score) || score < 0 || score > 1) {
    throw new RangeError(`Score must be between 0 and 1, got ${score}`);
  }
  const cutoffs = RANK_CUTOFFS[mode];
  if (score >= cutoffs.S) return 'S';
  if (score >= cutoffs.A) return 'A';
  if (score >= cutoffs.B) return 'B';
  return 'C';
}
