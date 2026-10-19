// Shared spacing, radius, and font sizes from the first build. Colors live in src/design/tokens.ts.
// Screens use these names instead of raw values, so a restyle happens in one place.

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 16, lg: 24, pill: 999 } as const;
export const font = { small: 13, body: 16, title: 20, large: 28, huge: 96 } as const;

/** Large enough for comfortable tapping on phones (WCAG target size). */
export const MIN_TAP_SIZE = 44;
