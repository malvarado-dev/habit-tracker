/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

// Acceptance (T11): the menu opens Profile and Habits on both layouts, and every
// interactive element on the menu and Profile has a test ID.
const read = (p: string) => readFileSync(join(__dirname, p), 'utf8');
const today = read('../app/index.tsx');
const menu = read('SideMenu.tsx');
const button = read('MenuButton.tsx');
const profile = read('../app/profile.tsx');

describe('acceptance: menu and Profile (T11)', () => {
  it('both Today layouts open the side menu from the menu button', () => {
    expect(today.match(/onPress=\{\(\) => setMenuOpen\(true\)\}/g)).toHaveLength(2);
    expect(today.match(/\{menu\}/g)).toHaveLength(2);
  });

  it('the menu button keeps its "Menu" label and 44 pt size', () => {
    expect(button).toContain('accessibilityLabel="Menu"');
    expect(button).toMatch(/width: 44,\s+height: 44/);
  });

  it('the menu offers Profile and Habits, and closes from the shade or back', () => {
    expect(menu).toContain("path: '/profile'");
    expect(menu).toContain("path: '/habits'");
    expect(menu).toContain('testID="side-menu-shade"');
    expect(menu).toContain('hardwareBackPress');
  });

  it.each([
    'profile-back',
    'profile-habits',
    'profile-goal-style',
    'profile-theme',
    'profile-week-',
    'profile-critter-name',
  ])('Profile has test ID %s', (id) => {
    expect(profile).toContain(id);
  });
});
