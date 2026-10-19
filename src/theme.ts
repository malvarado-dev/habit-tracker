// Old first-build values. Only the Celebration pop-up still uses these colors; it goes when the
// rank moment moves into the Background. Spacing, radius, and font sizes are still shared.
// Screens use these names instead of raw values, so a restyle happens in one place.

export const colors = {
  surface: '#FFFFFF',
  text: '#2B2118',
  textMuted: '#6B5A4A',
  accent: '#C2410C',
  overlay: 'rgba(20,14,8,0.55)',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 16, lg: 24, pill: 999 } as const;
export const font = { small: 13, body: 16, title: 20, large: 28, huge: 96 } as const;

/** Large enough for comfortable tapping on phones (WCAG target size). */
export const MIN_TAP_SIZE = 44;
