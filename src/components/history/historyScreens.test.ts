/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// Acceptance (T16): History and Day screens follow the build rules.
const read = (p: string) => readFileSync(join(__dirname, p), 'utf8');
const view = read('HistoryView.tsx');
const face = read('CritterFace.tsx');
const historyScreen = read('../../app/history.tsx');
const dayScreen = read('../../app/day/[date].tsx');
const menu = read('../SideMenu.tsx');
const today = read('../../app/index.tsx');

describe('acceptance: History (T16)', () => {
  it('the menu lists History after Profile and Habits', () => {
    const order = ['menu-profile', 'menu-habits', 'menu-history'].map((id) => menu.indexOf(id));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it.each([
    [view, 'history-prev-month'],
    [view, 'history-next-month'],
    [view, 'history-day-${cell.date}'],
    [view, 'history-week'],
    [historyScreen, 'history-back'],
    [dayScreen, 'day-back'],
  ])('has test ID %#', (source, id) => {
    expect(source).toContain(id);
  });

  it('wide shows the real History, not the placeholder', () => {
    expect(today).toContain('<HistoryView');
    expect(today).not.toContain('HistoryPlaceholder');
  });

  it('colors come from the theme or the critter palette, never raw hex', () => {
    for (const source of [view, face, historyScreen, dayScreen]) {
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    }
  });

  it('the Day screen has no Background, sky, or celebration', () => {
    for (const mod of ['components/Background', 'useCritterAndMoment', 'components/Critter']) {
      expect(dayScreen).not.toContain(`/${mod}'`);
    }
  });

  it('no test files live in src/app', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : [e.name],
      );
    expect(walk(join(__dirname, '../../app')).filter((f) => f.includes('.test.'))).toEqual([]);
  });
});
