import { describe, expect, it } from '@jest/globals';
import {
  BAD_HABIT_DESIGN_STORAGE_KEY,
  loadBadHabitDesign,
  loadPetLook,
  PET_LOOK_STORAGE_KEY,
  saveBadHabitDesign,
  savePetLook,
} from './settings';

const fakeStorage = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return {
    data,
    getItem: async (k: string) => data[k] ?? null,
    setItem: async (k: string, v: string) => {
      data[k] = v;
    },
  };
};

describe('Bad habits layout setting (P2-05)', () => {
  it('defaults to Design 1', async () => {
    expect(await loadBadHabitDesign(fakeStorage())).toBe('design1');
  });

  it('survives a restart: what is saved is what loads', async () => {
    const storage = fakeStorage();
    await saveBadHabitDesign(storage, 'design2');
    expect(storage.data[BAD_HABIT_DESIGN_STORAGE_KEY]).toBe('design2');
    expect(await loadBadHabitDesign(storage)).toBe('design2');
  });

  it('ignores a bad saved value', async () => {
    expect(
      await loadBadHabitDesign(fakeStorage({ [BAD_HABIT_DESIGN_STORAGE_KEY]: 'design3' })),
    ).toBe('design1');
  });

  it('falls back to Design 1 if storage fails', async () => {
    const broken = {
      getItem: async () => {
        throw new Error('no storage');
      },
      setItem: async () => {
        throw new Error('no storage');
      },
    };
    expect(await loadBadHabitDesign(broken)).toBe('design1');
    await expect(saveBadHabitDesign(broken, 'design2')).resolves.toBeUndefined();
  });
});

describe('Pet look setting (P2-15a)', () => {
  it('starts as Tabby-Orange, and a saved look loads back', async () => {
    expect(await loadPetLook(fakeStorage())).toBe('tabbyOrange');
    const storage = fakeStorage();
    await savePetLook(storage, 'tabbyGrayReal');
    expect(await loadPetLook(storage)).toBe('tabbyGrayReal');
  });

  it('an unknown saved look falls back to Tabby-Orange', async () => {
    expect(await loadPetLook(fakeStorage({ [PET_LOOK_STORAGE_KEY]: 'calico' }))).toBe(
      'tabbyOrange',
    );
  });
});
