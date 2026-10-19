/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

// Acceptance (T12): Back names the screen Habits came from, Remove uses an inline Undo bar
// (no pop-up), and every interactive element on Habits and Edit habit has a test ID.
const read = (p: string) => readFileSync(join(__dirname, p), 'utf8');
const habits = read('../../app/habits.tsx');
const edit = read('../../app/habit/[id].tsx');
const menu = read('../../components/SideMenu.tsx');
const profile = read('../../app/profile.tsx');

describe('acceptance: Habits and Edit habit screens (T12)', () => {
  it('Back on Habits names Today or Profile, depending on where it was opened', () => {
    expect(menu).toContain("params: { from: 'today' }");
    expect(profile).toContain("params: { from: 'profile' }");
    expect(habits).toContain("today: { label: 'Today'");
    expect(habits).toContain("profile: { label: 'Profile'");
  });

  it('Remove never opens a pop-up; Undo is an inline bar', () => {
    for (const src of [habits, edit]) expect(src).not.toMatch(/Alert\.|<Modal/);
    expect(habits).toContain('testID="habits-undo-bar"');
    expect(habits).toContain('tuning.habits.undoMs');
  });

  it('there is no plus and minus stepper', () => {
    expect(edit).not.toMatch(/target-(up|down)/);
  });

  it.each(['habits-back', 'habits-row-', 'habits-undo"'])('Habits has test ID %s', (id) => {
    expect(habits).toContain(id);
  });

  it.each([
    'edit-habit-back',
    'edit-habit-name"',
    'edit-goal-',
    'edit-preset-',
    'edit-day-',
    'edit-times-',
    'edit-habit-remove',
  ])('Edit habit has test ID %s', (id) => {
    expect(edit).toContain(id);
  });
});
