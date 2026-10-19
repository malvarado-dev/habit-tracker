import { describe, expect, it } from '@jest/globals';

import { DEFAULT_HABITS } from '@/features/tracker/state';

import { MAX_NAME_LENGTH } from './habitName';
import { isAdded, PREMADE_GROUPS, PREMADE_HABITS } from './premadeHabits';
import { resultLine } from './weeklyGoal';

// Mirror of the Notion "Premade habits" table (PRD-02). If this test fails after a change,
// update the table and this file together.
const NOTION_TABLE: [string, string, string, boolean][] = [
  ['Sleep', 'Health', 'Every day', true],
  ['Diet', 'Health', 'Every day', true],
  ['Wellbeing', 'Health', 'Every day', true],
  ['Exercise', 'Fitness', '3 times a week, any days', true],
  ['Walking', 'Fitness', 'Every day', false],
  ['Stretching', 'Fitness', 'Every day', false],
  ['Running', 'Fitness', '3 times a week, any days', false],
  ['Biking', 'Fitness', '3 times a week, any days', false],
  ['Meditation', 'Mind', 'Every day', false],
  ['Reading', 'Mind', 'Every day', false],
  ['Study', 'Mind', '3 times a week, any days', false],
  ['Pet Time', 'Fun and life', 'Every day', false],
  ['Family Time', 'Fun and life', '3 times a week, any days', false],
  ['Outdoors', 'Fun and life', '3 times a week, any days', false],
  ['Gaming', 'Fun and life', '3 times a week, any days', false],
];

describe('premade habits (T13)', () => {
  it('match the Notion table, row for row', () => {
    expect(PREMADE_HABITS.map((p) => [p.name, p.group, resultLine(p.goal), p.starter])).toEqual(
      NOTION_TABLE,
    );
  });

  it('every group has habits, and every name fits the name rules', () => {
    for (const g of PREMADE_GROUPS) expect(PREMADE_HABITS.some((p) => p.group === g)).toBe(true);
    for (const p of PREMADE_HABITS) expect(p.name.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
  });

  it('the starter habits match what a new user starts with', () => {
    const starters = PREMADE_HABITS.filter((p) => p.starter);
    expect(starters.map((p) => p.name).sort()).toEqual(DEFAULT_HABITS.map((h) => h.name).sort());
    for (const p of starters) {
      expect(DEFAULT_HABITS.find((h) => h.name === p.name)?.goal).toEqual(p.goal);
    }
  });

  it('acceptance: already-added habits are found by name, ignoring capitals', () => {
    const sleep = PREMADE_HABITS[0]!;
    expect(isAdded(sleep, DEFAULT_HABITS)).toBe(true);
    expect(isAdded(sleep, [{ ...DEFAULT_HABITS[0]!, name: ' SLEEP ' }])).toBe(true);
    expect(isAdded(PREMADE_HABITS[4]!, DEFAULT_HABITS)).toBe(false);
  });
});
