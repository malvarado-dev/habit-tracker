/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

import { createInitialState, trackerReducer } from '@/features/tracker/state';

import { pretendDateText, shortDate } from './testToolsText';

const read = (p: string) => readFileSync(join(__dirname, p), 'utf8');
const tools = read('TestTools.tsx');
const sheet = read('HabitSheet.tsx');

describe('Test tools text (T14)', () => {
  it('names the pretend day and how far ahead it is', () => {
    expect(shortDate('2026-10-21')).toBe('Wed, Oct 21');
    expect(pretendDateText('2026-10-19', 0)).toBe('Testing as Mon, Oct 19 (today)');
    expect(pretendDateText('2026-10-20', 1)).toBe('Testing as Tue, Oct 20 (1 day ahead)');
    expect(pretendDateText('2026-10-21', 2)).toBe('Testing as Wed, Oct 21 (2 days ahead)');
  });
});

describe('acceptance: Test tools (T14)', () => {
  it('Back to today returns to the real date and keeps every check-in', () => {
    let s = createInitialState();
    s = trackerReducer(s, { type: 'tapHabit', date: '2026-10-19', habitId: 'sleep' });
    s = trackerReducer(s, { type: 'nextDay' });
    s = trackerReducer(s, { type: 'nextDay' });
    const back = trackerReducer(s, { type: 'backToToday' });
    expect(back.dayOffset).toBe(0);
    expect(back.log).toEqual(s.log);
  });

  it('is clearly labeled as prototype only', () => {
    expect(tools).toContain('Test tools · prototype only');
    expect(tools).toContain("borderStyle: 'dashed'");
  });

  it('is easy to remove in one change: one flag and one render spot', () => {
    expect(sheet.match(/<TestTools/g)).toHaveLength(1);
    expect(sheet).toContain('SHOW_TEST_TOOLS ?');
    expect(tools).toContain('To remove after Stage 3');
  });

  it('no longer duplicates the Profile settings', () => {
    expect(tools).not.toMatch(/goal-style-|theme-option-/);
  });

  it.each([
    'test-tools',
    'test-tools-date',
    'next-day-button',
    'back-to-today-button',
    'reset-button',
  ])('has test ID %s', (id) => {
    expect(tools).toContain(`testID="${id}"`);
  });
});
