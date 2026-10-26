/// <reference types="node" />
// House rules (TESTING.md, rule 3): these read the code on purpose, like a lint rule.
// They don't test behavior. Behavior is tested by the unit and end-to-end tests.
import { describe, expect, it } from '@jest/globals';
import { readdirSync } from 'fs';
import { join } from 'path';

describe('house rule: no test files in src/app', () => {
  it('Expo Router would treat them as screens', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : [e.name],
      );
    expect(walk(join(__dirname, '../app')).filter((f) => f.includes('.test.'))).toEqual([]);
  });
});
