/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { getRank } from '@/rules/rank';
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
  it('a rank cutoff edit changes the rank the rules return', () => {
    const cutoffs = tuning.rank.cutoffs.Challenger as { S: number };
    const original = cutoffs.S;
    expect(getRank(0.85, 'Challenger')).toBe('A');
    cutoffs.S = 0.8;
    expect(getRank(0.85, 'Challenger')).toBe('S');
    cutoffs.S = original;
  });
});
