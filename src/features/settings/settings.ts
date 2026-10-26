// Saved app settings besides the Theme (T11): the Weekly goal style, and the prototype-only
// bad habit Design 1 / Design 2 switch (P2-05, used by P2-10). Settings are not tracking data:
// they never live in the Real or Test save. Kept on the device.
// Plain functions so they can be tested with a fake storage.

export type GoalStyle = 'ring' | 'dots';

export const GOAL_STYLES: GoalStyle[] = ['ring', 'dots'];
export const GOAL_STYLE_LABELS: Record<GoalStyle, string> = { ring: 'Ring', dots: 'Dots' };
export const DEFAULT_GOAL_STYLE: GoalStyle = 'ring';
export const GOAL_STYLE_STORAGE_KEY = 'settings.goalStyle';

interface SettingsStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

export function isGoalStyle(value: unknown): value is GoalStyle {
  return value === 'ring' || value === 'dots';
}

export async function loadGoalStyle(storage: SettingsStorage): Promise<GoalStyle> {
  try {
    const saved = await storage.getItem(GOAL_STYLE_STORAGE_KEY);
    return isGoalStyle(saved) ? saved : DEFAULT_GOAL_STYLE;
  } catch {
    return DEFAULT_GOAL_STYLE;
  }
}

export async function saveGoalStyle(storage: SettingsStorage, style: GoalStyle): Promise<void> {
  try {
    await storage.setItem(GOAL_STYLE_STORAGE_KEY, style);
  } catch {
    // Not saving only means the setting resets next launch.
  }
}

/** Bad habit layout under test (SPEC-01 question 4). Design 1: linked. Design 2: separate section. */
export type BadHabitDesign = 'design1' | 'design2';

export const BAD_HABIT_DESIGNS: BadHabitDesign[] = ['design1', 'design2'];
export const BAD_HABIT_DESIGN_LABELS: Record<BadHabitDesign, string> = {
  design1: 'Design 1',
  design2: 'Design 2',
};
export const DEFAULT_BAD_HABIT_DESIGN: BadHabitDesign = 'design1';
export const BAD_HABIT_DESIGN_STORAGE_KEY = 'settings.badHabitDesign';

export function isBadHabitDesign(value: unknown): value is BadHabitDesign {
  return value === 'design1' || value === 'design2';
}

export async function loadBadHabitDesign(storage: SettingsStorage): Promise<BadHabitDesign> {
  try {
    const saved = await storage.getItem(BAD_HABIT_DESIGN_STORAGE_KEY);
    return isBadHabitDesign(saved) ? saved : DEFAULT_BAD_HABIT_DESIGN;
  } catch {
    return DEFAULT_BAD_HABIT_DESIGN;
  }
}

export async function saveBadHabitDesign(
  storage: SettingsStorage,
  design: BadHabitDesign,
): Promise<void> {
  try {
    await storage.setItem(BAD_HABIT_DESIGN_STORAGE_KEY, design);
  } catch {
    // Not saving only means the switch resets next launch.
  }
}
