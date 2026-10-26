/// <reference types="node" />
// House rule (TESTING.md, rule 3): reads the code on purpose, like a lint rule.
// CI runs Playwright inside Microsoft's Playwright image, which ships one browser build. If
// @playwright/test is upgraded without the image, tests fail with "browser not found", so this
// keeps the two in step.
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '../..');
const ci = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')) as {
  packages: Record<string, { version?: string }>;
};

describe('CI Playwright image', () => {
  it('matches the installed @playwright/test version', () => {
    const installed = lock.packages['node_modules/@playwright/test']?.version;
    const image = ci.match(/mcr\.microsoft\.com\/playwright:v([\d.]+)-/)?.[1];
    expect(image).toBeDefined();
    expect(image).toBe(installed);
  });
});
