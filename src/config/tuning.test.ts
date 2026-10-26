/// <reference types="node" />
// House rule (TESTING.md, rule 3): reads the code on purpose, like a lint rule.
import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { dayTarget } from '@/rules/activityBar';
import type { Habit } from '@/rules/habits';
import { tuning } from './tuning';

const SCREEN_DIRS = ['../app', '../components'].map((d) => join(__dirname, d));

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });

describe('acceptance: no hardcoded colors or timings in screens', () => {
  const sources = SCREEN_DIRS.flatMap(files).map((p) => [p, readFileSync(p, 'utf8')] as const);

  it.each([
    ['hex color', /['"]#[0-9a-fA-F]{3,8}['"]/],
    ['rgb color', /rgba?\(/],
    ['numeric duration', /duration:\s*\d/],
    ['numeric delay', /(setTimeout|setInterval)\([^,]+,\s*\d/],
    ['numeric spring setting', /(damping|stiffness|mass):\s*\d/],
  ])('no %s', (_label, pattern) => {
    const offenders = sources.filter(([, text]) => pattern.test(text)).map(([p]) => p);
    expect(offenders).toEqual([]);
  });
});

describe('acceptance: changing tuning changes the app', () => {
  it('a full-share edit changes the Activity Bar target the rules return', () => {
    const bar = tuning.activityBar as { fullShare: number };
    const original = bar.fullShare;
    const habits: Habit[] = Array.from({ length: 10 }, (_, i) => ({
      id: `h${i}`,
      name: `h${i}`,
      color: 'habit1',
      schedule: { kind: 'anyDays' },
    }));
    expect(dayTarget(habits, '2026-10-25')).toBe(6);
    bar.fullShare = 0.8;
    expect(dayTarget(habits, '2026-10-25')).toBe(8);
    bar.fullShare = original;
  });
});
