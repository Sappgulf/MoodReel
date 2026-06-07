import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const routes = [
  { name: 'home', path: '/' },
  { name: 'tonight', path: '/tonight' },
  { name: 'watchlist', path: '/watchlist' },
  { name: 'stats', path: '/stats' },
];

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const outDir = path.join(process.cwd(), 'visual-snapshots', 'polish-upgrade');

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });

await page.addInitScript(() => {
  window.localStorage.setItem('moodreel-onboarded', 'true');
  window.localStorage.setItem('moodreel-install-dismissed', 'true');
  window.localStorage.setItem('moodreel-tmdb-api-key', 'test-key');
});

for (const route of routes) {
  const file = path.join(outDir, `${route.name}.png`);
  try {
    await page.goto(`${baseURL}${route.path}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`Captured ${route.path} -> ${file}`);
  } catch (error) {
    console.warn(`Skipping ${route.path}:`, error.message);
  }
}

await browser.close();
