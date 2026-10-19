/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { background, critter, spendioDark, spendioLight } from './tokens';

// The .md files in docs/design are the source of truth. This fails if tokens.ts drifts from them.
const docColors = (file: string): Record<string, string> => {
  const text = readFileSync(join(__dirname, '../../docs/design', file), 'utf8');
  const out: Record<string, string> = {};
  for (const [, key = '', hex = ''] of text.matchAll(/^ {2}([\w-]+): "(#[0-9A-F]{6})"$/gm)) {
    out[key.replace(/-(\w)/g, (_: string, c: string) => c.toUpperCase())] = hex;
  }
  return out;
};

describe('design tokens match docs/design', () => {
  const spendio = docColors('design-spendio.md');

  it('Spendio light matches every light token', () => {
    for (const [key, hex] of Object.entries(spendioLight)) {
      if (key === 'track') continue;
      expect([key, hex]).toEqual([key, spendio[key]]);
    }
  });

  it('Spendio dark uses each -dark value, or the light value when none exists', () => {
    for (const key of Object.keys(spendioLight) as (keyof typeof spendioLight)[]) {
      expect([key, spendioDark[key]]).toEqual([key, spendio[`${key}Dark`] ?? spendio[key]]);
    }
  });

  it('critter and background match their files exactly', () => {
    expect(critter).toEqual(docColors('critter.md'));
    expect(background).toEqual(docColors('background.md'));
  });
});
