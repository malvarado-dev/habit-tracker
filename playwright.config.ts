// Playwright settings (Quality > Test Architecture > Playwright Setup in Notion).
// `npm run e2e` runs every test in e2e/web against a fresh web build.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = !!process.env.CI;

export default defineConfig({
  // Playwright tests live apart from Jest unit tests, so neither runner picks up the other's files.
  testDir: './e2e/web',
  // Each test file runs in parallel; every test sets up its own data (see fixtures.ts).
  fullyParallel: true,
  // A stray test.only left in a commit fails CI instead of silently skipping everything else.
  forbidOnly: isCI,
  // CI retries a failed test once. A test that passes on retry is reported as "flaky", not hidden.
  retries: isCI ? 1 : 0,
  // List in the terminal; the HTML report is what you open (or download from CI) to dig in.
  // In CI, the github reporter also pins each failure to the pull request as an annotation.
  reporter: isCI ? [['list'], ['github'], ['html', { open: 'never' }]] : [['list'], ['html']],
  use: {
    // Every page.goto('') is relative to this, the same path GitHub Pages serves.
    baseURL: `http://localhost:${PORT}/habit-tracker/`,
    // React Native's testID becomes data-testid on the web, which getByTestId() reads.
    testIdAttribute: 'data-testid',
    // A step-by-step replay of a failed test, recorded only when it's retried.
    // Open it with `npx playwright show-trace <file>`, or from the HTML report.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // One browser at phone size, since the app is phone first. Safari (WebKit) comes later.
  projects: [{ name: 'phone-chromium', use: { ...devices['Pixel 7'] } }],
  // Playwright builds the web app and starts a server before the tests, and stops it after.
  // Locally it reuses a server that's already running, so repeat runs are fast.
  webServer: {
    command: `npm run export:web && node scripts/serve-web.mjs ${PORT}`,
    url: `http://localhost:${PORT}/habit-tracker/`,
    reuseExistingServer: !isCI,
    timeout: 300_000,
  },
});
