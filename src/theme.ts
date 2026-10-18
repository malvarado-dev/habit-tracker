// Placeholder design tokens borrowed from v0 (SPEC-00). The real design system comes in Stage 4.
// Screens use these names instead of raw values, so a restyle happens in one place.

export const colors = {
  background: '#FFF8F0',
  surface: '#FFFFFF',
  text: '#2B2118',
  textMuted: '#6B5A4A',
  textOnCard: '#FFFFFF',
  textOnCardMuted: '#E7DCCF',
  star: '#F5B83D',
  starEmpty: 'rgba(255,255,255,0.28)',
  accent: '#C2410C',
  accentText: '#FFFFFF',
  energy: '#F5B83D',
  energyTrack: '#EADFD2',
  border: '#E3D6C6',
  danger: '#B42318',
  skyDay: '#BFE3F7',
  skyDayBright: '#8FD0F5',
  skyNight: '#22284A',
  skyNightBright: '#2E3766',
  sun: '#FFC93C',
  moon: '#F2EBD3',
  moonGlow: '#FFF4C2',
  cloud: '#FFFFFF',
  overlay: 'rgba(20,14,8,0.55)',
} as const;

/** Card colors per habit position, from v0. */
export const cardColors = [
  '#3B3A5A',
  '#1E3A34',
  '#3A321E',
  '#2E1E3A',
  '#1E293B',
  '#3A1E24',
] as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 16, lg: 24, pill: 999 } as const;
export const font = { small: 13, body: 16, title: 20, large: 28, huge: 96 } as const;

/** Wider than this, the critter moves to the right and habits sit on the left. */
export const WIDE_LAYOUT_MIN_WIDTH = 900;
/** Large enough for comfortable tapping on phones (WCAG target size). */
export const MIN_TAP_SIZE = 44;
