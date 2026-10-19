// Energy bar words and math, kept apart from the component so they can be tested without rendering.
// The counts come from the rules (dueCount, checkedInCount): not-due habits never count, and
// Not today counts as checked in (SPEC-00).

/** How full the bar is, 0 to 1. A Rest day (nothing due) shows a full bar. */
export function energyFraction(checkedIn: number, due: number): number {
  if (due <= 0) return 1;
  return Math.min(1, Math.max(0, checkedIn / due));
}

/** What a screen reader hears. The bar itself shows no text. */
export function energyLabel(checkedIn: number, due: number): string {
  if (due <= 0) return 'Rest day, no habits due';
  return `${checkedIn} of ${due} habits checked in`;
}
