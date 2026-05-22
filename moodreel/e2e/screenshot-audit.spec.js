import { test } from '@playwright/test';
import { installTmdbMocks, prepareAppStorage } from './tmdbMock.js';
import fs from 'fs';
import path from 'path';

const OUT_DIR = process.env.SCREENSHOT_DIR || path.join(process.cwd(), 'screenshots', 'audit');

const PAGES = [
  {
    name: '01-discover',
    path: '/',
    setup: async page => {
      const mood = page.locator('.emoji-picker button').first();
      if (await mood.isVisible()) await mood.click();
      await page.waitForTimeout(800);
    },
  },
  {
    name: '02-tonight',
    path: '/tonight',
    setup: async page => {
      await page.getByRole('button', { name: /^cozy$/i }).click();
      await page.getByRole('button', { name: /Get tonight picks/i }).click();
      await page.waitForTimeout(2000);
    },
  },
  { name: '03-watchlist', path: '/watchlist' },
  { name: '04-achievements', path: '/achievements' },
  { name: '05-profile', path: '/profile' },
  { name: '06-stats', path: '/stats' },
  { name: '07-calendar', path: '/calendar' },
  { name: '08-movie-detail', path: '/movie/550' },
  { name: '09-not-found', path: '/does-not-exist' },
];

test.describe('UI screenshot audit', () => {
  test.beforeAll(() => {
    fs.mkdirSync(path.join(OUT_DIR, 'desktop'), { recursive: true });
    fs.mkdirSync(path.join(OUT_DIR, 'mobile'), { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await installTmdbMocks(page);
    await prepareAppStorage(page);
  });

  for (const viewport of [
    { label: 'desktop', width: 1280, height: 800 },
    { label: 'mobile', width: 390, height: 844 },
  ]) {
    for (const entry of PAGES) {
      test(`${viewport.label} — ${entry.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(entry.path);
        if (entry.setup) await entry.setup(page);
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(400);
        await page.screenshot({
          path: path.join(OUT_DIR, viewport.label, `${entry.name}.png`),
          fullPage: true,
        });
      });
    }

    test(`${viewport.label} — 10-keyboard-shortcuts`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.keyboard.press('?');
      await page.getByRole('dialog', { name: /keyboard shortcuts/i }).waitFor({ timeout: 5000 });
      await page.screenshot({
        path: path.join(OUT_DIR, viewport.label, '10-keyboard-shortcuts.png'),
        fullPage: true,
      });
    });
  }
});
