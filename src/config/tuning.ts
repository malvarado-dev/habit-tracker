// The one tunable settings file (SPEC-00). Every timing, effect value, and rank cutoff lives here,
// so playtest tuning never means hunting through screens. Change a number, reload, feel the difference.
// Times are milliseconds. Distances are points.
//
// Scene positions measured from the art (bed, pet spots, room offset) live in
// src/scene/room-layout.json and are read in here, so `tuning.scene` is still the one place to look.

import roomLayout from '@/scene/room-layout.json';

export const tuning = {
  /** Living room scene (Prototype 2). Art-measured numbers come from room-layout.json. */
  scene: {
    ...roomLayout,
    /** Where the habit sheet starts, as a share of the screen height. Moved lower only when the bed
     * or pet would sit under it (tall tablets). */
    sheetTopRatio: 0.4,
    /** Points between the status bar and the top of the window glass. The room moves up to fit. */
    windowGapBelowStatusBar: 6,
    /** Points kept between the lowest of the bed or pet and the top of the sheet. */
    sceneClearOfSheet: 12,
    /** Room color shown under the room art if a tall screen ever runs past it (the floor). */
    floorColor: '#AD7F5A',
    /** Menu button over the room: dark ink on a see-through light circle (3:1 on the wall). Fixed,
     * not theme colors, because the room is art. */
    menuInk: '#2B2622',
    menuButton: 'rgba(255, 255, 255, 0.45)',
  },

  /** The pet's starting values (Prototype 2). */
  pet: {
    /** Confidence (0 to 100) for a new save and for saves upgraded from Prototype 1. */
    startConfidence: 20,
    /** Test tools Confidence stepper: how much each tap moves it. */
    confidenceStep: 10,
  },

  /** Rank moment plays this long after the last habit is scored (T15, in the Background). */
  celebrationDelayMs: 2000,

  /**
   * End-of-day rank moment (T15). Bigger at each rank; C still celebrates showing up.
   * flash: how bright the sky gets (0 to 1, behind the critter). pulse: sun or moon scale.
   * hops and hopHeight: critter hops (points). sparkles: how many (B twinkle, A burst, S shower).
   */
  moment: {
    flash: { C: 0, B: 0, A: 0.25, S: 0.35 },
    reducedMotionFlash: { C: 0.12, B: 0.2, A: 0.3, S: 0.42 },
    pulse: { C: 1.12, B: 1.15, A: 1.2, S: 1.25 },
    hops: { C: 1, B: 1, A: 2, S: 1 },
    hopHeight: { C: 14, B: 18, A: 20, S: 40 },
    sparkles: { C: 0, B: 6, A: 10, S: 18 },
    /** How long each part plays. */
    flashMs: 900,
    reducedMotionFlashMs: 1400,
    pulseMs: 900,
    hopMs: 210,
    twinkleMs: 900,
    twinkleStaggerMs: 90,
    burstMs: 1000,
    showerMs: 1400,
    showerSpreadMs: 500,
    rayFlareMs: 1500,
    /** Distances in points: twinkle ring around the sun, burst reach, shower fall. */
    twinkleRadius: 44,
    burstDistance: 80,
    showerFall: 220,
    sparkleSize: 12,
  },

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
    /** Crescent moon: inner curve width as a share of the moon's radius (smaller = fatter crescent). */
    crescentInner: 0.6,
  },

  activityBar: {
    /** Food, toy, and pet icons on the Activity Bar notches (P2-07), in points. */
    iconSize: 30,
    /** Points from the track's bottom edge to the icons' bottoms. */
    iconBottomInset: 2,
  },
  energy: {
    /** Energy bar fill glides to its new width this fast. Reduced motion jumps instead. */
    fillMs: 450,
    /** Celebrations when the fill crosses the top tick (S) and when it reaches 100%. They start once the fill arrives. */
    celebrate: {
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
    /** "Weekly goal met · Habit" under the bar (T18): how long it stays, its fade in and out, and the bar's soft glow. */
    goalMet: {
      showMs: 1900,
      fadeMs: 280,
      glowMs: 900,
      glowOpacity: 0.55,
    },
  },

  habits: {
    /** How long the Undo bar stays after a habit is removed. */
    undoMs: 5000,
  },

  day: {
    /** How often the Day screen's "Habits lock in 38hrs" line refreshes (T24). */
    clockRefreshMs: 60_000,
  },

  menu: {
    /** Side menu slide in and out, and how dark the shade behind it gets (0 to 1). */
    slideMs: 220,
    shadeOpacity: 0.35,
    /** Swipe left to close (T25): how far a drag moves before it counts as a swipe. */
    swipeStartOffset: 12,
    /** Letting go past this share of the panel width closes it (0 to 1). */
    swipeCloseShare: 1 / 3,
    /** A flick left this fast (points per second) closes it from any distance. */
    swipeCloseVelocity: 500,
  },

  critter: {
    /** The body runs this far below its box (viewBox units), so the biggest hop never shows an edge. */
    bodyExtension: 80,
    /** Asleep Zs: each one drifts up and fades over zDriftMs, starting zStaggerMs apart. */
    zDriftMs: 2600,
    zStaggerMs: 900,
    zRise: 40,
    zSize: 30,
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
