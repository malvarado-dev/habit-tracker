// Saved app settings besides the Theme (T11): the prototype-only bad habit Design 1 / Design 2
// switch (P2-05, used by P2-10) and the pet look (P2-15a). The Weekly goal style went with weekly goals (P2-08a). Settings are not tracking data:
// they never live in the Real or Test save. Kept on the device.
// Plain functions so they can be tested with a fake storage.

import type { BadHabitDesign } from '@/rules/badHabits';
import { DEFAULT_PET_LOOK, isPetLookId, type PetLookId } from '@/scene/petLookData';

interface SettingsStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

/** Bad habit layout under test (SPEC-01 question 4). Design 1: linked. Design 2: separate section. */
export type { BadHabitDesign };

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

/** Pet look under test (P2-15a). Kept on the device, outside the Real and Test saves. */
export const PET_LOOK_STORAGE_KEY = 'settings.petLook';

export async function loadPetLook(storage: SettingsStorage): Promise<PetLookId> {
  try {
    const saved = await storage.getItem(PET_LOOK_STORAGE_KEY);
    return isPetLookId(saved) ? saved : DEFAULT_PET_LOOK;
  } catch {
    return DEFAULT_PET_LOOK;
  }
}

export async function savePetLook(storage: SettingsStorage, look: PetLookId): Promise<void> {
  try {
    await storage.setItem(PET_LOOK_STORAGE_KEY, look);
  } catch {
    // Not saving only means the look resets next launch.
  }
}
