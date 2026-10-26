// Habit Card text. Plain functions so they can be unit tested without rendering anything. The
// card's spoken name is its visible text (#113), so there's no separate label to build.

/** First letter of the name, as the icon placeholder until the icon sheet. */
export function iconLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
