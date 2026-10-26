// What the Habit Card says to screen readers. Plain functions so they can be unit tested
// without rendering anything.

/** First letter of the name, as the icon placeholder until the icon sheet. */
export function iconLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/**
 * The whole card in one sentence: "Water, 3 of 8 today" for a frequency habit, "Sleep, to do"
 * for a once-a-day habit before its log.
 */
export function cardAccessibilityLabel(name: string, count: number, timesPerDay: number): string {
  const label = name.trim() || 'Untitled habit';
  if (timesPerDay > 1) return `${label}, ${Math.min(count, timesPerDay)} of ${timesPerDay} today`;
  return `${label}, ${count >= 1 ? 'done' : 'to do'}`;
}
