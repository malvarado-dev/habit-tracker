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
    /** Hours (0 to 23, phone's local time) when the day, dusk, and night skies start. */
    dayStartHour: 6,
    duskStartHour: 17,
    nightStartHour: 20,
    /** One full turn of the S-rank sun rays. */
    raySpinMs: 12000,
    /** S-rank moon bounce, each way. */
    moonBounceMs: 900,
    moonBounceHeight: 6,
    /** C-rank and asleep inviting pulse, each way. */
    pulseMs: 1600,
    pulseScale: 1.06,
  },

  energy: {
    /** Energy bar fill glides to its new width this fast. Reduced motion jumps instead. */
    fillMs: 450,
  },

  critter: {
    /** Small wiggle when the critter is tapped: how far it turns, and each half of the wiggle. */
    wiggleDegrees: 6,
    wiggleMs: 90,
    /** Breathing: how much the body grows (0.015 = 1.5%) and each half of one breath. */
    breathScale: 0.015,
    breathMs: 1800,
    /** Asleep breathing is this many times slower. Reduced motion breathes at this strength. */
    sleepBreathSlowdown: 1.6,
    reducedMotionBreathStrength: 0.5,
    /** Blink: random gap between blinks, how long the eyes stay shut, and how often a blink doubles. */
    blinkGapMinMs: 2500,
    blinkGapMaxMs: 6000,
    blinkMs: 120,
    doubleBlinkChance: 0.2,
    /** Glance: random gap, how far the pupils slide (viewBox units), and how long they hold. */
    glanceGapMinMs: 6000,
    glanceGapMaxMs: 12000,
    glanceDistance: 5,
    glanceMoveMs: 220,
    glanceHoldMs: 1100,
    /** Wake-up on the first check-in: hop height (points), stretch, and spring bounciness. */
    wakeHop: 16,
    wakeStretch: 0.08,
    wakeDamping: 7,
    /** Small hop each time a habit is scored. */
    scoreHop: 7,
    scoreHopMs: 140,
    /** Halo behind the critter: opacity at the lowest and highest score, fade time, and size. */
    glowMin: 0.12,
    glowMax: 0.45,
    glowFadeMs: 600,
    glowSize: 1.35,
  },

  celebration: {
    /** Spring bounciness for the old pop-up. Lower is bouncier. */
    popDamping: 9,
  },
} as const;
