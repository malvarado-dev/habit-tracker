// Main Quest card words (P2-07), kept apart from the component so they can be tested without rendering.

export type QuestUnit = 'days' | 'streak';

/** "3/7 Check in days" or "0/3 Check in streak". */
export function questProgressText(done: number, total: number, unit: QuestUnit): string {
  return `${done}/${total} Check in ${unit}`;
}
