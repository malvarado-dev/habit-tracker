/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

import { modeHelpText, pretendDateText, realDateText, shortDate } from './testToolsText';

const read = (p: string) => readFileSync(join(__dirname, p), 'utf8');
const tools = read('TestTools.tsx');
const screen = read('../app/test-tools.tsx');
const sheet = read('HabitSheet.tsx');
const menu = read('SideMenu.tsx');
const banner = read('TestModeBanner.tsx');
const layout = read('../app/_layout.tsx');

describe('Test tools text (T14, T17)', () => {
  it('names the pretend day and how far ahead it is', () => {
    expect(shortDate('2026-10-21')).toBe('Wed, Oct 21');
    expect(pretendDateText('2026-10-19', 0)).toBe('Testing as Mon, Oct 19 (today)');
    expect(pretendDateText('2026-10-20', 1)).toBe('Testing as Tue, Oct 20 (1 day ahead)');
    expect(pretendDateText('2026-10-21', 2)).toBe('Testing as Wed, Oct 21 (2 days ahead)');
  });

  it('Real shows only the real date and says the tools are off', () => {
    expect(realDateText('2026-10-19')).toBe('Today is Mon, Oct 19');
    expect(modeHelpText('real')).toContain('real data');
    expect(modeHelpText('test')).toContain('untouched');
  });
});

describe('acceptance: Test tools screen (T17)', () => {
  it('is gone from the habit sheet', () => {
    expect(sheet).not.toContain('TestTools');
    expect(sheet).not.toContain('SHOW_TEST_TOOLS');
  });

  it('the menu shows it after a divider, hidden with SHOW_TEST_TOOLS', () => {
    const history = menu.indexOf('menu-history');
    const divider = menu.indexOf('styles.divider');
    const item = menu.indexOf('testID="menu-test-tools"');
    expect(history).toBeGreaterThan(0);
    expect(divider).toBeGreaterThan(history);
    expect(item).toBeGreaterThan(divider);
    expect(menu).toContain('SHOW_TEST_TOOLS ?');
    expect(menu).toContain('Prototype only');
  });

  it('is clearly labeled as prototype only', () => {
    expect(screen).toContain('Prototype only · removed after Stage 3');
    expect(tools).toContain("borderStyle: 'dashed'");
    expect(tools).toContain('To remove after Stage 3');
  });

  it('the Real / Test switch is a choice for screen readers', () => {
    expect(tools).toContain('accessibilityRole="radiogroup"');
    expect(tools).toContain('accessibilityRole="radio"');
    expect(tools).toContain('accessibilityState={{ selected: on }}');
  });

  it('Next day, Back to today, and Reset show only in Test', () => {
    const testOnly = tools.indexOf("{mode === 'test' ? (\n        <View style={styles.row}>");
    expect(testOnly).toBeGreaterThan(0);
    for (const id of ['next-day-button', 'back-to-today-button', 'reset-button']) {
      expect(tools.indexOf(id)).toBeGreaterThan(testOnly);
    }
  });

  it('the Test mode strip sits below every screen, never over them', () => {
    expect(banner).toContain('Test mode: not your real data');
    expect(banner).toContain("if (mode !== 'test') return null;");
    expect(banner).not.toContain("position: 'absolute'");
    expect(layout.indexOf('<TestModeBanner />')).toBeGreaterThan(layout.indexOf('<Stack'));
  });

  it('no longer duplicates the Profile settings', () => {
    expect(tools).not.toMatch(/goal-style-|theme-option-/);
  });

  it.each([
    [tools, 'test-tools'],
    [tools, 'test-tools-date'],
    [tools, 'mode-${m.key}'],
    [tools, 'next-day-button'],
    [tools, 'back-to-today-button'],
    [tools, 'reset-button'],
    [screen, 'test-tools-back'],
    [banner, 'test-mode-banner'],
  ])('has test ID %#', (source, id) => {
    expect(source).toContain(id);
  });
});
