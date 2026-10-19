// The one tunable settings file (SPEC-00). Every timing, effect value, and rank cutoff lives here,
// so playtest tuning never means hunting through screens. Change a number, reload, feel the difference.
// Times are milliseconds. Distances are points.

export const tuning = {
  /** Rank moment plays this long after the last habit is scored (T15 uses it in the Background). */
  celebrationDelayMs: 2000,

  rank: {
    /** Lowest daily score (0 to 1) for each rank. Anything lower is C. One set for everyone. */
    cutoffs: { S: 0.9, A: 0.75, B: 0.5 },
  },

  card: {
    /** How far a swipe travels before it scores. */
    swipeThreshold: 110,
    /** Sideways movement before a card starts following the finger. Higher lets vertical scrolls win more often (T6). */
    swipeStartOffset: 16,
    /** In-card score effects (T9). Distances and sizes are points; [min, max] ranges are random per particle. */
    effects: {
      /** How long one particle lives, from start to faded out. */
      particleMs: 650,
      /** Where the burst starts: this far in from the card's right edge, and this far down. */
      originFromRight: 44,
      originFromTop: 24,
      /** Started: small sparkle. */
      sparkleCount: 4,
      sparkleDistance: [14, 24] as const,
      sparkleSize: [8, 12] as const,
      sparkleStaggerMs: 40,
      /** On track: applause pop. A ring bursts out, then dots rise. */
      popRingSize: 44,
      popRingMs: 420,
      popDotCount: 6,
      popDotDistance: [18, 30] as const,
      popDotSize: [4, 6] as const,
      popDotDelayMs: 60,
      /** Nailed it: fireworks in two waves with trails. */
      fireworkFirstWave: 8,
      fireworkSecondWave: 6,
      fireworkWaveGapMs: 140,
      fireworkDistance: [30, 52] as const,
      fireworkSize: [3, 5] as const,
      /** Card motion: the On track pulse (scale) and how long each half takes. */
      pulseScale: 1.03,
      pulseMs: 160,
      /** Skip: the card eases to gray. */
      dimMs: 250,
      /** Reduced motion: the stars flash instead of particles. */
      flashMs: 200,
      flashOpacity: 0.35,
    },
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
    /** Celebrations when the fill crosses the flag (S) and when it reaches 100%. They start once the fill arrives. */
    celebrate: {
      /** Flag wave: how far it tilts each way (degrees) and each tilt's time. */
      flagTiltDegrees: 8,
      flagWaveMs: 130,
      /** A light band sweeps once across the fill. Width in points. */
      shimmerMs: 650,
      shimmerWidth: 28,
      shimmerOpacity: 0.55,
      /** 100% only: the fill brightens briefly, and small sparkles pop off the end of the bar. */
      flashOpacity: 0.35,
      flashMs: 280,
      sparkleCount: 5,
      sparkleDistance: [10, 20] as const,
      sparkleSize: [6, 9] as const,
      sparkleMs: 600,
    },
  },

  habits: {
    /** How long the Undo bar stays after a habit is removed. */
    undoMs: 5000,
  },

  menu: {
    /** Side menu slide in and out, and how dark the shade behind it gets (0 to 1). */
    slideMs: 220,
    shadeOpacity: 0.35,
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
  },
} as const;
