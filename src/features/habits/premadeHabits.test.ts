import { describe, expect, it } from '@jest/globals';

import { DEFAULT_HABITS } from '@/features/tracker/state';

import { MAX_NAME_LENGTH } from './habitName';
import {
  HABIT_CATEGORIES,
  isAdded,
  offeredBadHabits,
  PREMADE_BAD_HABITS,
  PREMADE_HABITS,
  suggestedPair,
} from './premadeHabits';
import { resultLine } from './schedule';

// Mirror of the Notion Habits database (PRD-02 Premade catalog), good habits first. If this fails
// after a change, update the database and this file together.
const NOTION_GOOD: [string, string, string][] = [
  ['Brush Teeth', 'Daily Maintenance', 'Every day'],
  ['Drink Water', 'Daily Maintenance', 'Every day'],
  ['Make Bed', 'Daily Maintenance', 'Every day'],
  ['Medicine', 'Daily Maintenance', 'Every day'],
  ['Sleep', 'Daily Maintenance', 'Every day'],
  ['Eat Healthy', 'Body & Mind', 'Every day'],
  ['Exercise', 'Body & Mind', 'Any days'],
  ['Journal', 'Body & Mind', 'Any days'],
  ['Meditate', 'Body & Mind', 'Any days'],
  ['Positivity', 'Body & Mind', 'Every day'],
  ['Pray', 'Body & Mind', 'Every day'],
  ['Stretch', 'Body & Mind', 'Any days'],
  ['Supplements', 'Body & Mind', 'Any days'],
  ['Running', 'Body & Mind', 'Any days'],
  ['Biking', 'Body & Mind', 'Any days'],
  ['Walking', 'Body & Mind', 'Every day'],
  ['Budget', 'Growth & Productivity', 'Any days'],
  ['Code', 'Growth & Productivity', 'Any days'],
  ['Plan Day', 'Growth & Productivity', 'Any days'],
  ['Read', 'Growth & Productivity', 'Any days'],
  ['Study', 'Growth & Productivity', 'Any days'],
  ['Family Time', 'Social & Relationships', 'Any days'],
  ['Friend Time', 'Social & Relationships', 'Any days'],
  ['Pet Time', 'Social & Relationships', 'Every day'],
  ['Arts & Crafts', 'Hobbies', 'Any days'],
  ['Gaming', 'Hobbies', 'Any days'],
  ['Music', 'Hobbies', 'Any days'],
  ['Outdoors', 'Hobbies', 'Any days'],
];

// Bad habits and the good habit each is related to in Notion.
const NOTION_BAD: [string, string | undefined][] = [
  ['Poor Sleep', 'Sleep'],
  ['Eat Out', 'Eat Healthy'],
  ['Sedentary', 'Exercise'],
  ['Alcohol', undefined],
  ['Smoking', undefined],
  ['Snacks & Sweets', undefined],
  ['Soda', undefined],
  ['Late Night Screens', undefined],
  ['Too Much Gaming', undefined],
  ['Too Much TV', undefined],
  ['Over-working', undefined],
];

describe('habit catalog (PRD-02, P2-09)', () => {
  it('good habits match the Notion database, row for row', () => {
    expect(PREMADE_HABITS.map((p) => [p.name, p.category, resultLine(p.schedule)])).toEqual(
      NOTION_GOOD,
    );
  });

  it('bad habits and their pairings match the Notion database', () => {
    const name = (key?: string) => PREMADE_HABITS.find((p) => p.key === key)?.name;
    expect(PREMADE_BAD_HABITS.map((b) => [b.name, name(b.pairsWith)])).toEqual(NOTION_BAD);
  });

  it('every category has habits, and every name fits the name rules', () => {
    for (const c of HABIT_CATEGORIES)
      expect(PREMADE_HABITS.some((p) => p.category === c)).toBe(true);
    for (const p of [...PREMADE_HABITS, ...PREMADE_BAD_HABITS]) {
      expect(p.name.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
    }
  });

  it('keys are unique across the whole catalog', () => {
    const keys = [...PREMADE_HABITS, ...PREMADE_BAD_HABITS].map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('Design 2 hides the mirror bad habits (PRD-15)', () => {
    expect(offeredBadHabits('design1')).toHaveLength(11);
    expect(offeredBadHabits('design2').map((b) => b.name)).not.toEqual(
      expect.arrayContaining(['Poor Sleep']),
    );
    expect(offeredBadHabits('design2').map((b) => b.name)).not.toContain('Sedentary');
    expect(offeredBadHabits('design2').map((b) => b.name)).toContain('Eat Out');
  });

  it('a catalog bad habit suggests its pair only when the user has that good habit', () => {
    const poorSleep = PREMADE_BAD_HABITS[0]!;
    const eatOut = PREMADE_BAD_HABITS[1]!;
    expect(suggestedPair(poorSleep, DEFAULT_HABITS)).toBe('sleep');
    expect(suggestedPair(eatOut, DEFAULT_HABITS)).toBeUndefined();
    expect(suggestedPair(undefined, DEFAULT_HABITS)).toBeUndefined();
  });

  it('acceptance: already-added habits are found by name, ignoring capitals', () => {
    const sleep = PREMADE_HABITS.find((p) => p.key === 'sleep')!;
    expect(isAdded(sleep, DEFAULT_HABITS)).toBe(true);
    expect(isAdded(sleep, [{ ...DEFAULT_HABITS[0]!, name: ' SLEEP ' }])).toBe(true);
    expect(isAdded(PREMADE_HABITS[0]!, DEFAULT_HABITS)).toBe(false);
  });
});
