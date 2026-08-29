/**
 * Capture screenshots of the app running against the deterministic TMDB
 * fixtures used by the e2e suite, in both themes and at desktop + mobile
 * widths. Useful for reviewing visual changes without a live TMDB key.
 *
 *   npm run screenshots:ui
 *
 * Output lands in `visual-snapshots/ui/`.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { installTonightTmdbMocks } from '../e2e/fixtures/tmdb.js';

const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000';
const OUT_DIR = path.resolve(process.cwd(), 'visual-snapshots/ui');
// Full-page shots show the whole scroll experience, which is what matters when
// reviewing information hierarchy; set SCREENSHOT_FULL_PAGE=0 for viewport only.
const FULL_PAGE = process.env.SCREENSHOT_FULL_PAGE !== '0';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];

const THEMES = ['dark', 'light'];

/** Routes worth reviewing, with an optional interaction to reach real content. */
const ROUTES = [
  { name: 'discover', path: '/', prepare: runMoodSearch },
  { name: 'discover-empty', path: '/' },
  { name: 'tonight', path: '/tonight' },
  { name: 'watchlist', path: '/watchlist' },
  { name: 'profile', path: '/profile' },
  { name: 'stats', path: '/stats' },
];

async function runMoodSearch(page) {
  const toggle = page.getByRole('button', { name: /More ways to explore/ });
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
  }
  const picker = page.locator('.emoji-picker button').first();
  if (!(await picker.isVisible().catch(() => false))) return;
  await picker.click();
  await page
    .getByRole('button', { name: /Find Tonight's Picks|Discover|Refresh Results/ })
    .first()
    .click();
  await page
    .locator('.recommendation, .swipe-card')
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const captured = [];

  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 2,
      });

      await context.addInitScript(
        ([selectedTheme]) => {
          window.localStorage.setItem('moodreel-onboarded', 'true');
          window.localStorage.setItem('moodreel-install-dismissed', 'true');
          window.localStorage.setItem('moodreel-tmdb-api-key', 'test-key');
          window.localStorage.setItem('moodreel-theme', selectedTheme);
          window.localStorage.setItem('moodreel-theme-auto', 'false');
        },
        [theme]
      );

      const page = await context.newPage();
      await installTonightTmdbMocks(page);

      for (const route of ROUTES) {
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });
        if (route.prepare) await route.prepare(page);
        // Let entry animations settle so shots are comparable between runs.
        await page.waitForTimeout(600);

        const file = path.join(OUT_DIR, `${route.name}-${theme}-${viewport.name}.png`);
        await page.screenshot({ path: file, fullPage: FULL_PAGE });
        captured.push(path.relative(process.cwd(), file));
      }

      await context.close();
    }
  }

  await browser.close();
  console.log(
    `Captured ${captured.length} screenshots into ${path.relative(process.cwd(), OUT_DIR)}`
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
