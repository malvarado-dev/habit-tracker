/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

import { contrastRatio } from '@/design/theme/theme';
import { background as sky } from '@/design/tokens';
import { textStyle, urbanist } from '@/design/fonts';

const today = readFileSync(join(__dirname, '../app/index.tsx'), 'utf8');

const sheet = readFileSync(join(__dirname, 'HabitSheet.tsx'), 'utf8');

describe('acceptance: cards scroll while the Background stays still', () => {
  it('the Background and critter are on Today, never inside the scrolling habit sheet', () => {
    expect(today).toContain('<Background');
    expect(today).toContain('<Critter');
    expect(sheet).not.toContain('<Background');
    expect(sheet).not.toContain('<Critter');
  });

  it('the habit cards are inside the scroll view, under the Energy bar', () => {
    const bar = sheet.indexOf('<EnergyBar');
    const scrollOpen = sheet.indexOf('<ScrollView');
    const card = sheet.indexOf('<HabitCard');
    const scrollClose = sheet.indexOf('</ScrollView>');
    expect(bar).toBeLessThan(scrollOpen);
    expect(card).toBeGreaterThan(scrollOpen);
    expect(card).toBeLessThan(scrollClose);
  });

  it('both layouts put the habit sheet in a testable container', () => {
    expect(today.match(/testID="habit-sheet"/g)).toHaveLength(2);
    expect(today).toContain('testID="background-card"');
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
  it('maps each Spendio weight to its own font family', () => {
    expect(urbanist('300')).toBe('Urbanist_300Light');
    expect(urbanist('700')).toBe('Urbanist_700Bold');
    expect(textStyle('label')).toMatchObject({ fontSize: 13, fontFamily: 'Urbanist_700Bold' });
    expect(textStyle('habitName')).not.toHaveProperty('fontWeight');
  });
});
