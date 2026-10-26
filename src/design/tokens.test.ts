/// <reference types="node" />
// Design doc check: the tokens in code must match the design docs, so the docs stay true.
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { background, critter, darkTheme, lightTheme } from './tokens';

// The Prototype 1 .md files in docs/design/prototype-1 are the source of truth. This fails if tokens.ts drifts from them.
const docColors = (file: string): Record<string, string> => {
  const text = readFileSync(join(__dirname, '../../docs/design/prototype-1', file), 'utf8');
  const out: Record<string, string> = {};
  for (const [, key = '', hex = ''] of text.matchAll(/^ {2}([\w-]+): "(#[0-9A-F]{6})"$/gm)) {
    out[key.replace(/-(\w)/g, (_: string, c: string) => c.toUpperCase())] = hex;
  }
  return out;
};

describe('design tokens match docs/design/prototype-1', () => {
  const doc = docColors('design-system.md');

  it('Light theme matches every light token', () => {
    for (const [key, hex] of Object.entries(lightTheme)) {
      if (key === 'track') continue;
      expect([key, hex]).toEqual([key, doc[key]]);
    }
  });

  it('Dark theme uses each -dark value, or the light value when none exists', () => {
    for (const key of Object.keys(lightTheme) as (keyof typeof lightTheme)[]) {
      expect([key, darkTheme[key]]).toEqual([key, doc[`${key}Dark`] ?? doc[key]]);
    }
  });

  it('critter and background match their files exactly', () => {
    expect(critter).toEqual(docColors('critter.md'));
    expect(background).toEqual(docColors('background.md'));
  });
});
