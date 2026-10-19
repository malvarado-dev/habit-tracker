/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// Regression: <Link asChild> passes the child's style array to an Expo Router Slot, which
// crashes on phones ("You are passing an array of styles to a child of <Slot>") but not on
// web. Navigate with router.push from a Pressable instead.
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return name.endsWith('.tsx') ? [path] : [];
  });

describe('no <Link asChild> anywhere', () => {
  it('every screen and component navigates without Link asChild', () => {
    const offenders = files(join(__dirname, '..')).filter((p) =>
      /<Link[^>]*\basChild\b/.test(readFileSync(p, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});
