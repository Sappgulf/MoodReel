import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const outDir = path.join(process.cwd(), 'visual-snapshots', 'home-redesign');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });

await page.addInitScript(() => {
  window.localStorage.setItem('moodreel-onboarded', 'true');
  window.localStorage.setItem('moodreel-install-dismissed', 'true');
  window.localStorage.setItem('moodreel-tmdb-api-key', 'test-key');
});

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(900);

const moodInput = page.locator('input[aria-label="Search by mood"]').first();
await moodInput.fill('cozy comfort');
await page.locator('button.primary-button', { hasText: "Find Tonight's Picks" }).first().click();
await page.waitForTimeout(2200);

await page.screenshot({ path: path.join(outDir, 'desktop-with-picks.png'), fullPage: true });
console.log('Captured desktop-with-picks');

await browser.close();
