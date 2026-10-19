// The one tunable settings file (SPEC-00). Every timing, effect value, and rank cutoff lives here,
// so playtest tuning never means hunting through screens. Change a number, reload, feel the difference.
// Times are milliseconds. Distances are points.

export const tuning = {
  /** Rank celebration plays this long after the last habit is scored. */
  celebrationDelayMs: 2000,

  rank: {
    /** Lowest daily score (0 to 1) for each rank. Anything lower is C. One set for everyone. */
    cutoffs: { S: 0.9, A: 0.75, B: 0.5 },
  },

  card: {
    /** How far a swipe travels before it scores. */
    swipeThreshold: 110,
    /** In-card score effect fade and grow. */
    effectMs: 900,
    /** Each particle rises this far (plus a stagger), then drifts up for driftMs. */
    particleLift: 18,
    particleLiftStagger: 6,
    particleDriftTo: 30,
    particleDriftMs: 400,
  },

  sky: {
    /** One full turn of the S-rank sun rays. */
    raySpinMs: 12000,
    /** S-rank moon bounce, each way. */
    moonBounceMs: 900,
    moonBounceHeight: 6,
    /** C-rank and asleep inviting pulse, each way. */
    pulseMs: 1600,
    pulseScale: 1.06,
  },

  critter: {
    /** Old first-build beam from the sky to the critter. T5 replaces this. */
    beamTravelMs: 650,
    beamVisibleMs: 550,
    beamFadeMs: 150,
    hopDelayMs: 600,
    hopHeight: 14,
    hopPerStar: 4,
  },

  celebration: {
    /** Spring bounciness for the old pop-up. Lower is bouncier. */
    popDamping: 9,
  },
} as const;
