// Design tokens. Generated from docs/design/*.md, which are the source of truth (Technical Design).
// Figma variables mirror these files. Change a token in the .md file, Figma, and here in the same step.
// tokens.test.ts fails if this file and the .md files drift apart.

/** Light theme: habit sheet, cards, text, and Energy bar (design-system.md). */
export const lightTheme = {
  surface: '#FFFFFF',
  surfaceSheet: '#FBFAF5',
  surfaceDim: '#EDEDED',
  onSurface: '#1F1F1F',
  onSurfaceMuted: '#5E5A52',
  border: '#ECE8DF',
  primary: '#F5F04A',
  onPrimary: '#1F1F1F',
  inverse: '#1F1F1F',
  onInverse: '#FFFFFF',
  habit1: '#A855F7',
  habit2: '#3B82F6',
  habit3: '#15943F',
  habit4: '#DB2777',
  habit5: '#EA580C',
  habit6: '#0D9488',
  habit7: '#58900B',
  habit8: '#6366F1',
  scoreStarted: '#BE185D',
  scoreStartedStar: '#EC4899',
  scoreOnTrack: '#15803D',
  scoreOnTrackStar: '#16A34A',
  scoreNailedIt: '#B45309',
  scoreNailedItStar: '#D97706',
  starScoreNeeded: '#8E8E93',
  starNotToday: '#6B7280',
  danger: '#B91C1C',
  track: '#1F1F1F',
} as const;

export type ThemeColors = { readonly [K in keyof typeof lightTheme]: string };

/**
 * Dark theme: same names as light, so swapping themes is one line.
 * Tokens with no -dark value in design-system.md (lemon, score stars, inverse) stay the same,
 * as the file says. `track` is the Energy bar track: inverse in light, track-dark in dark.
 */
export const darkTheme: ThemeColors = {
  surface: '#3A3D33',
  surfaceSheet: '#2A2C24',
  surfaceDim: '#26281F',
  onSurface: '#F2F1EA',
  onSurfaceMuted: '#C9C7B8',
  border: '#73786A',
  primary: '#F5F04A',
  onPrimary: '#1F1F1F',
  inverse: '#1F1F1F',
  onInverse: '#FFFFFF',
  habit1: '#C084FC',
  habit2: '#60A5FA',
  habit3: '#4ADE80',
  habit4: '#F472B6',
  habit5: '#FB923C',
  habit6: '#2DD4BF',
  habit7: '#A3E635',
  habit8: '#818CF8',
  scoreStarted: '#F9A8D4',
  scoreStartedStar: '#EC4899',
  scoreOnTrack: '#4ADE80',
  scoreOnTrackStar: '#16A34A',
  scoreNailedIt: '#FACC15',
  scoreNailedItStar: '#D97706',
  starScoreNeeded: '#A3A396',
  starNotToday: '#8E8E82',
  danger: '#FCA5A5',
  track: '#1A1B16',
};

/** Shared critter palette (critter.md). Never changes with the theme. */
export const critter = {
  bodySunny: '#FFC400',
  bodySky: '#2F9BFF',
  bodyMint: '#3CCB6E',
  bodyPink: '#FF6FA5',
  bodyTangerine: '#FF8A3D',
  bodyViolet: '#9B6BFF',
  ink: '#1F1F1F',
  mouth: '#FF4D3A',
} as const;

/** Shared skies (background.md). Change only with time of day, never with the theme. */
export const background = {
  dayTop: '#F6D58E',
  dayMid: '#EBDD95',
  dayBottom: '#CFE6A2',
  daySun: '#FFF4C2',
  dayCloud: '#FFFFFF',
  duskTop: '#25344A',
  duskMid: '#4C4A63',
  duskLow: '#9A6E6C',
  duskHorizon: '#C9927A',
  duskMoon: '#F3EBDD',
  nightTop: '#262A55',
  nightMid: '#4A4880',
  nightLow: '#7C7FA0',
  nightHorizon: '#A9BC8E',
  nightMoon: '#F4F1FF',
  star: '#FFFFFF',
  daySparkle: '#B45309',
  onSkyDay: '#1F1F1F',
  onSkyDark: '#FFFFFF',
} as const;

export const habitPalette = [
  'habit1',
  'habit2',
  'habit3',
  'habit4',
  'habit5',
  'habit6',
  'habit7',
  'habit8',
] as const;

export const fontFamily = 'Urbanist';

/** Type scale from design-system.md. Sizes and line heights in points. */
export const typography = {
  display: { fontSize: 32, fontWeight: '300', lineHeight: 35, letterSpacing: -0.64 },
  title: { fontSize: 22, fontWeight: '600', lineHeight: 26 },
  habitName: { fontSize: 17, fontWeight: '600', lineHeight: 21 },
  body: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
  label: { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  caption: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
} as const;

export const rounded = { md: 12, lg: 20, xl: 24, '2xl': 28, full: 9999 } as const;
export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 } as const;

/** Habit Card sizes from design-system.md components (progress-ring, habit-icon, stars). */
export const habitCardSizes = {
  ring: 48,
  ringStroke: 4,
  icon: 36,
  star: 18,
  /** Skip: width of the diagonal slash across each outlined star. */
  skipSlash: 2,
  dot: 8,
  dotStroke: 1.5,
} as const;

/** How strong tints are: the icon circle behind the letter, and the empty ring track. */
export const tints = { icon: 0.13, ringTrack: 0.12 } as const;

/** Card shadow from design-system.md Elevation & Depth: soft, warm, low. */
export const shadows = {
  card: '0px 4px 14px rgba(120, 100, 60, 0.08), 0px 1px 2px rgba(120, 100, 60, 0.06)',
} as const;

/** Today phone layout (SPEC-00): the habit sheet starts this far down the screen. */
export const todayLayout = {
  sheetTopRatio: 0.4,
  /** How far the critter's face sits above the sheet; its body runs behind the sheet. */
  critterOverlap: 56,
  critterWidthRatio: 0.62,
  critterMaxWidth: 280,
  sheetMaxWidth: 560,
  sunSize: 64,
} as const;

/** Today wide layout (T10, Figma "Today · Wide"): desktop web and iPad landscape. */
export const wideLayout = {
  /** Wide applies at this width or more, in landscape. Phones and iPad portrait stay single column. */
  minWidth: 900,
  /** And at least this tall, so a phone turned sideways stays single column. */
  minHeight: 600,
  /** The whole wide layout stops growing here and centers, so big monitors don't stretch it (#51). */
  maxWidth: 1280,
  pagePadding: 24,
  columnGap: 24,
  leftColumnWidth: 400,
  /** The Background card takes this share of the right column's height; History takes the rest. */
  sceneHeightRatio: 0.45,
  sceneRadius: 28,
  /** Critter width as a share of the Background card, with a cap. Its body runs off the card's bottom. */
  critterWidthRatio: 0.45,
  critterMaxWidth: 360,
  critterSink: 0.12,
} as const;

/** Energy bar (design-system.md energy-bar, T18). Sizes in points. */
export const energyBar = {
  trackHeight: 14,
  trackPadding: 3,
  fillHeight: 8,
  /** Tick marks at the B, A, and S cutoffs; the top (S) tick runs this far past the track. */
  tickWidth: 3,
  topTickOverhang: 3,
  /** Gap between the "Today · 64%" row and the track. */
  labelGap: 6,
  /** The soft glow ring around the track for Weekly goal met. */
  glowSpread: 5,
} as const;

/** "Weekly goal met · Habit" under the Energy bar (T18). 19 pt bold is large text, so habit colors pass 3:1. */
export const weeklyGoalMet = {
  fontSize: 19,
  lineHeight: 24,
  /** The slot keeps this height even when empty, so the cards never jump. */
  slotHeight: 24,
} as const;

/** History (T16, canvas "History options · Stage 3"). Sizes in points. */
export const history = {
  /** Day cell: minimum height (fits the face plus the date) and corner radius. */
  cellMinHeight: 52,
  cellRadius: 12,
  cellGap: 2,
  /** Today's outline. */
  todayBorder: 2,
  /** Critter face in a day cell, and the larger one on the Day screen. */
  faceWidth: 30,
  dayFaceWidth: 56,
  /** Future days and days outside the month are this faint. */
  faintOpacity: 0.4,
  /** Locked days on the Day screen: cards dimmed to this. */
  lockedCardOpacity: 0.5,
  /** Week panel progress dots. */
  dot: 9,
  dotStroke: 1.5,
  dotGap: 5,
  weekRowMinHeight: 28,
  /** Room for "7 of 7" and "3 +1" so the dots line up. */
  countMinWidth: 52,
  /** The highlighted week row behind the week panel's week. */
  weekRowRadius: 14,
  panelRadius: 20,
} as const;

/** Sky brightness per live rank, 0 to 1 (SPEC-00: C dim, B a little glow, A bright, S rays). */
export const skyGlow = { asleep: 0.1, rest: 0.3, C: 0.2, B: 0.4, A: 0.65, S: 0.9 } as const;
