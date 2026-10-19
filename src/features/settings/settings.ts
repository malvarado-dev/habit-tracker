// Saved app settings besides the Theme (T11): the Weekly goal style. Kept on the device.
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
