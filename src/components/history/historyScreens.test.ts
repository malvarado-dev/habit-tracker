/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// Acceptance (T16, P2-18a): the History screen follows the build rules. The Day screen and
// critter faces were removed in P2-18a.
const read = (p: string) => readFileSync(join(__dirname, p), 'utf8');
const view = read('HistoryView.tsx');
const historyScreen = read('../../app/history.tsx');
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
    [historyScreen, 'history-back'],
    [view, 'history-day-title'],
    [view, 'history-day-status'],
    [view, 'history-streak'],
  ])('has test ID %#', (source, id) => {
    expect(source).toContain(id);
  });

  it('wide shows the real History, not the placeholder', () => {
    const scene = read('../SceneLayout.tsx');
    expect(scene).toContain('<HistoryView');
    expect(scene + today).not.toContain('HistoryPlaceholder');
  });

  it('colors come from the theme or the critter palette, never raw hex', () => {
    for (const source of [view, historyScreen]) {
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    }
  });

  it('the Day screen is gone; History holds the day (P2-18a)', () => {
    expect(view + historyScreen + today).not.toContain('/day/[date]');
  });

  it('no test files live in src/app', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : [e.name],
      );
    expect(walk(join(__dirname, '../../app')).filter((f) => f.includes('.test.'))).toEqual([]);
  });
});

describe('acceptance: no week highlight in the calendar (T20)', () => {
  const view = readFileSync(join(__dirname, 'HistoryView.tsx'), 'utf8');
  it('calendar rows have no gray highlight, and the week panel is gone with weekly goals', () => {
    expect(view).not.toContain('focusRow');
    expect(view).not.toContain('WeekPanel');
  });
});
