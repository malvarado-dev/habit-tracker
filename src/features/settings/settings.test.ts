import { describe, expect, it } from '@jest/globals';
import { GOAL_STYLE_STORAGE_KEY, loadGoalStyle, saveGoalStyle } from './settings';

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

describe('Weekly goal style setting (T11)', () => {
  it('defaults to Ring', async () => {
    expect(await loadGoalStyle(fakeStorage())).toBe('ring');
  });

  it('survives a restart: what is saved is what loads', async () => {
    const storage = fakeStorage();
    await saveGoalStyle(storage, 'dots');
    expect(storage.data[GOAL_STYLE_STORAGE_KEY]).toBe('dots');
    expect(await loadGoalStyle(storage)).toBe('dots');
  });

  it('ignores a bad saved value', async () => {
    expect(await loadGoalStyle(fakeStorage({ [GOAL_STYLE_STORAGE_KEY]: 'stars' }))).toBe('ring');
  });

  it('falls back to Ring if storage fails', async () => {
    const broken = {
      getItem: async () => {
        throw new Error('no storage');
      },
      setItem: async () => {
        throw new Error('no storage');
      },
    };
    expect(await loadGoalStyle(broken)).toBe('ring');
    await expect(saveGoalStyle(broken, 'dots')).resolves.toBeUndefined();
  });
});
