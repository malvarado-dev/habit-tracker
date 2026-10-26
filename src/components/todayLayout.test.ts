/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

import { contrastRatio } from '@/design/theme/theme';
import { background as sky } from '@/design/tokens';
import { textStyle, urbanist } from '@/design/fonts';

const today = readFileSync(join(__dirname, '../app/index.tsx'), 'utf8');

const sheet = readFileSync(join(__dirname, 'HabitSheet.tsx'), 'utf8');
// Today's layout lives in SceneLayout since T23, shared with the Day screen.
const scene = readFileSync(join(__dirname, 'SceneLayout.tsx'), 'utf8');

describe('acceptance: cards scroll while the Background stays still', () => {
  it('the Background and critter are on Today, never inside the scrolling habit sheet', () => {
    expect(today).toContain('<SceneLayout');
    expect(scene).toContain('<Background');
    expect(scene).toContain('<Critter');
    expect(sheet).not.toContain('<Background');
    expect(sheet).not.toContain('<Critter');
  });

  it('the habit cards are inside the scroll view, under the Energy bar', () => {
    const bar = sheet.indexOf('<ActivityBar');
    const scrollOpen = sheet.indexOf('<ScrollView');
    const scrollClose = sheet.indexOf('</ScrollView>');
    const today = sheet.indexOf("section('today'");
    const anytime = sheet.indexOf("section('anytime'");
    expect(bar).toBeLessThan(scrollOpen);
    expect(sheet).toContain('{habits.map(card)}');
    for (const at of [today, anytime]) {
      expect(at).toBeGreaterThan(scrollOpen);
      expect(at).toBeLessThan(scrollClose);
    }
  });

  it('sheet order: Activity Bar, Main Quest, Today, Anytime, Bad habits, History (P2-07)', () => {
    const order = [
      '<ActivityBar',
      '<MainQuestCard',
      "section('today'",
      "section('anytime'",
      'testID="bad-habits-section"',
      'testID="history-link"',
    ].map((s) => sheet.indexOf(s));
    expect(order.every((at) => at > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('the sheet bar shows the Activity Bar icons; Bad habits only show once one exists', () => {
    expect(sheet).toMatch(/<ActivityBar[^>]*activityIcons/);
    expect(sheet).toContain('badHabits.length > 0 ?');
    expect(sheet).not.toMatch(/Done/);
  });

  it('both layouts put the habit sheet in a testable container', () => {
    expect(scene.match(/testID="habit-sheet"/g)).toHaveLength(2);
    expect(scene).toContain('testID="background-card"');
  });

  it('there is no header on Today (SPEC-00)', () => {
    expect(today).not.toMatch(/function Header|accessibilityRole="header"/);
  });
});

describe('menu button contrast on every sky (3:1, background.md)', () => {
  it.each([
    ['day', sky.onSkyDay, sky.dayTop],
    ['dusk', sky.onSkyDark, sky.duskTop],
    ['night', sky.onSkyDark, sky.nightTop],
  ])('%s sky', (_time, ink, top) => {
    expect(contrastRatio(ink, top)).toBeGreaterThanOrEqual(3);
  });
});

describe('Urbanist', () => {
  it('maps each font weight to its own font family', () => {
    expect(urbanist('300')).toBe('Urbanist_300Light');
    expect(urbanist('700')).toBe('Urbanist_700Bold');
    expect(textStyle('label')).toMatchObject({ fontSize: 13, fontFamily: 'Urbanist_700Bold' });
    expect(textStyle('habitName')).not.toHaveProperty('fontWeight');
  });
});
