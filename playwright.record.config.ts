// Review recordings (P2-11 onward): `npm run e2e:record` runs e2e/recordings and saves videos to
// test-results/. Same build, server, and phone size as the tests in playwright.config.ts.
import { defineConfig } from '@playwright/test';

import base from './playwright.config';

export default defineConfig({
  ...base,
  testDir: './e2e/recordings',
  testMatch: '**/*.record.ts',
  retries: 0,
  reporter: [['list']],
});
