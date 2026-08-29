import { defineConfig, devices } from '@playwright/test';

const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /production\.spec\.js/,
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testIgnore: /production\.spec\.js/,
    },
    {
      // Production-only behaviour: the same-origin proxy transport and the
      // absence of a client-side key exist solely in a built bundle, so these
      // run against `vite preview` rather than the dev server.
      name: 'production',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: PREVIEW_URL,
        // The built app registers a PWA service worker. Requests it makes do
        // not pass through page.route(), and its cache makes runs
        // order-dependent, so it is disabled for these tests.
        serviceWorkers: 'block',
      },
      testMatch: /production\.spec\.js/,
    },
  ],
  webServer: [
    {
      command: 'npm start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      // Builds first, so the production project always tests current source.
      command: `npm run build && npm run preview -- --port ${PREVIEW_PORT} --strictPort`,
      url: PREVIEW_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
    },
  ],
});
