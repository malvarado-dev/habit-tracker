// The one tunable settings file (SPEC-00). Every timing, effect value, and Activity Bar rule lives here,
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
    /** Points between the top bar (Menu button and quest pill) and the top of the window glass. */
    windowGapBelowTopBar: 12,
    /** Points kept between the lowest of the bed or pet and the Today row at rest (#133). */
    sceneClearOfList: 12,
    /** The Today row never starts lower than this share of the screen, so cards show on short screens. */
    listTopMaxRatio: 0.66,
    /** Height of the Today row (Today pill and Activity Bar). */
    todayRowHeight: 36,
    /** Scroll distance over which the strip behind the stuck Today row fades in. */
    stripFadeDistance: 16,
    /** Shadow under everything that floats over the room (cards, pills, Bad habits). */
    floatShadow: '0px 3px 10px rgba(43, 38, 34, 0.22)',
    /**
     * Wall above the room art when the room moves down (#133): the art's top edge, as color bands.
     * `from` and `to` are shares of the width.
     */
    wallTop: [
      { from: 0, to: 0.2205, color: '#ADB18B' },
      { from: 0.2205, to: 0.9501, color: '#9B9F7A' },
      { from: 0.9501, to: 1, color: '#AEB38D' },
    ],
    /** Source rows of the room art (two plank rows) repeated below it to the screen's bottom. */
    floorRepeat: [2908, 3274] as const,
    /** Room color shown under the room art if a tall screen ever runs past it (the floor). */
    floorColor: '#AD7F5A',
    /** Menu button over the room: dark ink on a see-through light circle (3:1 on the wall). Fixed,
     * not theme colors, because the room is art. */
    menuInk: '#2B2622',
    menuButton: 'rgba(255, 255, 255, 0.45)',
  },

  /** Explore (P2-16, #87, rules/explore.ts). Starting values for testing. */
  explore: {
    /** Coins found per exploring day: random in this range, fixed for each date. */
    coinsMin: 5,
    coinsMax: 15,
    /** Neighborhood layers, in the art's own pixels (2172 x 724 each). The far layer sits this
     * much higher so the skyline shows above the town. */
    layerSize: [2172, 724] as const,
    /** Ground under the near layer, down to the screen's bottom (#135): its size, and how much of
     * its top hides behind the near layer's bushes. */
    groundSize: [2172, 1448] as const,
    groundOverlap: 220,
    farRaise: 230,
    /** Where the pet's paws touch the path, from the top of the near layer. */
    pathY: 600,
    /** The pet's width as a share of the screen width while exploring. */
    petWidthShare: 0.42,
    /** Scroll speed of each layer, in points per second: near fastest, far slowest. */
    speeds: { near: 60, mid: 30, far: 10 },
    /** Step bob: how far the pet rises, and one step's length. */
    bobHeight: 3,
    bobMs: 380,
    /** Layer tint over the art by time of day, so daylight art matches the sky. */
    tint: {
      day: { color: '#1E2856', opacity: 0 },
      dusk: { color: '#4A3A6A', opacity: 0.2 },
      night: { color: '#1E2856', opacity: 0.35 },
    },
  },

  /** Quests (P2-15, #86, PRD-14). Starting values for testing. */
  quest: {
    heal: {
      /** Check-in days to heal, counted from the accept day. */
      goal: 7,
      /** Added to the worked-out stats once claimed (PRD-09: quests drive stats). */
      rewardLove: 10,
      rewardConfidence: 10,
      /** Claim celebration: this many hearts, closer together than a purr. */
      celebrateHearts: 5,
      celebrateHeartOverlap: 0.45,
    },
  },

  /** The pet's starting values (Prototype 2). */
  pet: {
    /** Love and Confidence (P2-13, #84, PRD-09). Worked out from the log (rules/petStats.ts).
     * Starting values for testing: quests will be the main driver, and scoring gets revisited.
     * Stats should build slowly, over weeks. */
    stats: {
      /** Both stats (0 to 100) before anything is logged. */
      startLove: 20,
      startConfidence: 20,
      /** Each completed habit adds this to its linked stat. */
      perHabit: 2,
      /** Each Activity Bar notch a day passes adds this to Love and Confidence. */
      perNotch: 5,
      /** The stat each premade category raises. */
      byCategory: {
        'Daily Maintenance': 'confidence',
        'Body & Mind': 'confidence',
        'Growth & Productivity': 'confidence',
        'Social & Relationships': 'love',
        Hobbies: 'love',
      } as const,
      /** Custom (or renamed) habits raise this one. */
      customHabit: 'confidence' as const,
    },
    /** Test tools Love and Confidence steppers: how much each tap moves them. */
    statStep: 10,

    /** Activity Bar payoff and petting (P2-14, #85, rules/payoff.ts). Visual only. */
    moments: {
      /** Love above this purrs at you once per app open (PRD-09). */
      affectionLoveAbove: 30,
      /** One small heart: rise and fade. */
      heartMs: 1100,
      /** Heart size and how far it rises, in points. */
      heartSize: 14,
      heartRise: 18,
      /** Purr: this many hearts, each starting when the last is this far through (0 to 1). */
      purrHearts: 3,
      purrHeartOverlap: 0.7,
      /** Eat and pounce end with a "thank you": eyes closed and one heart. */
      thanksDelayMs: 150,
      thanksMs: 900,
      /** Bowl slides in; toy is tossed in and bounces twice. */
      bowlInMs: 600,
      toyInMs: 1000,
      /** Toy bounce heights, as a share of the toss height. */
      toyBounces: [0.3, 0.12] as const,
      /** Prop size (a share of the pet's width) and the gap beside the pet's right side. */
      propSize: 0.32,
      propGap: 4,
      /** How far up the toss starts, and how far right of the pet, in points. */
      tossHeight: 110,
      tossFrom: 140,
      /** The prop stays a moment after the thank you, then fades. */
      propHoldMs: 300,
      propOutMs: 400,
      /** Quiet gap before the next queued moment. */
      restMs: 300,
      /** Swipe distance on the pet that counts as petting, in points. */
      petSwipe: 24,
      /** Full-bar caption above the bar. */
      captionMs: 3000,
      captionFadeMs: 300,
    },
    /** Spots (P2-12, PRD-09): under hideBelow the pet hides behind the bed; up to restUpTo it
     * rests on the bed once awake; above that it sits in the middle of the room. */
    hideBelow: 10,
    restUpTo: 25,

    /** Idle motion on the pet PNGs (P2-11, #82): breathe, blink, and a reaction bounce on request. Whole body only. */
    motion: {
      /** Personality as data. 1 is the default cat. blinkSpeed above 1 blinks quicker; reactionSize
       * scales the jump and squash; idleTiming above 1 waits longer between blinks. */
      personality: { blinkSpeed: 1, reactionSize: 1, idleTiming: 1 },

      /** Breathing grows from the feet: taller and a touch narrower, never even all-over scaling.
       * Each breath picks its own length and depth, then holds a moment before the next. */
      breath: {
        /** How much taller the body gets at the top of a breath (0.012 = 1.2%). */
        rise: 0.012,
        /** Each breath's depth varies by up to this share of `rise`, up or down. */
        riseVariation: 0.35,
        /** Width given back while rising, as a share of the rise (keeps the volume steady). */
        narrow: 0.4,
        inMinMs: 1400,
        inMaxMs: 2000,
        outMinMs: 1700,
        outMaxMs: 2500,
        /** Rest at the bottom of a breath, so it never reads as a steady bob. */
        holdMinMs: 200,
        holdMaxMs: 900,
        /** Asleep breaths are this many times slower and this much deeper. */
        sleepSlowdown: 1.6,
        sleepDepth: 1.4,
        /** Reduced motion breathes at this strength. */
        reducedMotionStrength: 0.5,
      },

      /** Blink: random gap, then the eyes-closed PNG for `closedMs`. Sometimes a double blink. */
      blink: {
        gapMinMs: 2500,
        gapMaxMs: 6500,
        closedMs: 130,
        doubleChance: 0.2,
        /** Eyes-open gap inside a double blink. */
        doubleGapMs: 140,
      },

      /** Reaction bounce (P2-11b, #106), four beats: crouch and hold, jump with a stretch, hang
       * at the top, land hard and spring back. Only plays on a request (wake, Test tools). */
      reaction: {
        /** Crouch: how far the body squashes (0.16 = 16% shorter), how long, then a held beat. */
        crouchSquash: 0.16,
        crouchMs: 260,
        crouchHoldMs: 140,
        /** Jump: height in points, rise time, and the stretch on the way up. */
        height: 30,
        riseMs: 240,
        stretch: 0.12,
        /** Hang at the top so the eye catches it. */
        apexHoldMs: 160,
        fallMs: 180,
        /** Landing: squash on contact, hold it a beat, then a spring that overshoots and settles. */
        landSquash: 0.14,
        landMs: 70,
        landHoldMs: 100,
        settleDamping: 7,
        settleStiffness: 220,
        /** Width given back when squashed or stretched, as a share of the height change. */
        squashWidth: 0.6,
        /** The contact shadow shrinks by this share at the top of the jump. */
        shadowShrink: 0.35,
        /** Eyes stay shut this much longer after the landing hold, so they open on the rebound. */
        eyesOpenAfterLandMs: 80,
        /** Wait after Today shows (or the pet wakes) before reacting. */
        startDelayMs: 450,
      },
    },
  },

  card: {
    /** Press feedback on a log: the card shrinks a little, then springs back. */
    pressScale: 0.96,
    pressMs: 90,
    /** Sideways drag before a card starts sliding, so vertical scrolls win (T6). */
    slideStartOffset: 16,
    /** How long to hold a card before its menu opens. */
    longPressMs: 450,
    /** After a slide starts, a tap this soon is the finger lifting, not a log. */
    ignoreTapAfterSlideMs: 600,
  },

  /** The segmented ring around a frequency habit's icon (PRD-15). */
  ring: {
    /** Good log fill and the empty track. Fixed colors from the ticket, same in both themes. */
    gold: '#D97706',
    /** Linked bad logs fill after the gold ones (design-system.md ring-bad). */
    slate: '#475569',
    track: '#E6E2D9',
    /** Degrees of empty space between segments. */
    gapDegrees: 10,
    /** Ring line thickness, in points. */
    stroke: 4,
  },

  sky: {
    /** Hours (0 to 23, phone's local time) when the day, dusk, and night skies start. */
    dayStartHour: 6,
    duskStartHour: 17,
    nightStartHour: 20,
    /** One full turn of the sun rays once the bar is full (wide layout). */
    raySpinMs: 12000,
    /** Moon bounce once the bar is full, each way. */
    moonBounceMs: 900,
    moonBounceHeight: 6,
    /** Asleep inviting pulse, each way. */
    pulseMs: 1600,
    pulseScale: 1.06,
    /** Crescent moon: inner curve width as a share of the moon's radius (smaller = fatter crescent). */
    crescentInner: 0.6,
  },

  activityBar: {
    /** PRD-14 Activity Bar table. Change these and the PRD together, after playtesting. */
    /** Share of today's possible logs needed to fill the bar, rounded up. */
    fullShare: 0.6,
    /** Most logs one habit adds to the possible total and to the fill. */
    capPerHabit: 3,
    /** The bar never fills from fewer logs than this, unless fewer are possible. */
    minToFill: 2,
    /** Full never takes more logs than this. */
    maxToFill: 12,
    /** Highest times per day a habit can be set to. */
    timesPerDayMax: 12,
    /** Internal Love/Confidence thresholds (0 to 1). No visible bar markers (#137). */
    notches: [1 / 3, 2 / 3, 1] as const,
  },
  energy: {
    /** Energy bar fill glides to its new width this fast. Reduced motion jumps instead. */
    fillMs: 450,
    /** The full-bar celebration. It starts once the fill arrives. */
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
  },

  /** History display settings (#146). */
  history: {
    countdownTickMs: 60_000,
    undoIconSize: 20,
    undoIconStroke: 2,
  },

  /** Bad habits tray (P2-09). */
  badHabits: {
    /** Compact minus/plus popup, with the count kept on the chip badge. */
    stepperWidth: 112,
    /** The count badge grows this much when a slip is added, then springs back. */
    bumpScale: 1.25,
    bumpMs: 120,
    /** How long to hold a chip before the stepper opens. */
    longPressMs: 450,
  },

  /** Coins from logs (PRD-15 Scoring, P2-08c). */
  coins: {
    /** Coins each log earns, gold or linked slate. */
    perLog: 1,
    /** Only this many logs per habit per day earn Coins. */
    logsPerHabitPerDay: 3,
    /** Most Coins logs can earn in a day. Null means no cap: set once Coin prices exist. */
    dailyCap: null as number | null,
    /** Coin bar: slide in and out, and how long it stays after the last Coin lands. */
    barSlideMs: 260,
    barHoldMs: 1200,
    /** Each flying coin's trip from the card to the bar, and the gap between coins. */
    flyMs: 520,
    flyGapMs: 90,
    /** At most this many coins fly at once; more Coins still count, they just don't all fly. */
    maxFlying: 6,
    /** How high a flying coin arcs on its way to the bar, in points. */
    flyArc: 60,
    /** Placeholder coin and bar colors, fixed like art (not theme colors) until the coin art exists. */
    coinFill: '#F2B705',
    coinEdge: '#B07D00',
    barColor: 'rgba(31, 31, 31, 0.92)',
    barText: '#FFFFFF',
  },

  habits: {
    /** Room for Urbanist descenders in the Manage habits title on Android. */
    titleLineHeight: 40,
    titleBottomPadding: 4,
    /** Feedback when pressing management and bad-habit form controls. */
    pressedOpacity: 0.7,
    /** How long the Undo bar stays after a log or a remove. */
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
    /** Wake-up on the first log: hop height (points), how long the rise takes, stretch, and spring bounciness. */
    wakeHop: 16,
    wakeHopMs: 140,
    wakeStretch: 0.08,
    wakeDamping: 7,
  },
} as const;
