import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env.BASE_URL || 'http://localhost:3000';

const artifactsSuffix = process.env.PW_ARTIFACTS_SUFFIX;
const reportDir = artifactsSuffix
  ? `playwright-report-${artifactsSuffix}`
  : 'playwright-report';
const resultsDir = artifactsSuffix
  ? `test-results-${artifactsSuffix}`
  : 'test-results';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: 'tests',

  tsconfig: 'tsconfig.spec.json',

  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: resultsDir,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,

  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,

  expect: { timeout: 15_000 },

  // Reporter to use
  reporter: [
    // generate annotations in CI or prints a line for each test being run in local
    [process.env.CI ? 'github' : 'list'],
    // produces a self-contained folder that contains report for the test run
    [
      'html',
      {
        open: process.env.CI ? 'never' : 'on-failure',
        outputFolder: path.resolve(__dirname, reportDir),
      },
    ],
  ],

  use: {
    baseURL,

    navigationTimeout: 30_000,
    actionTimeout: 15_000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    // Capture screenshot after each test failure.
    screenshot: 'only-on-failure',

    // Emulates the user locale.
    locale: 'fr-FR',

    // Emulates the user timezone.
    timezoneId: 'Europe/Paris',

    // Viewport used for all pages in the context.
    viewport: { width: 1280, height: 1024 },

    // Test Id prefix
    testIdAttribute: 'data-test',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
