import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const outDir = path.join(process.cwd(), 'visual-snapshots', 'home-redesign');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const desktop = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });

const init = () => {
  window.localStorage.setItem('moodreel-onboarded', 'true');
  window.localStorage.setItem('moodreel-install-dismissed', 'true');
  window.localStorage.setItem('moodreel-tmdb-api-key', 'test-key');
};

for (const [label, page] of [
  ['desktop', desktop],
  ['mobile', mobile],
]) {
  await page.addInitScript(init);
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(outDir, `${label}.png`), fullPage: true });
  console.log(`Captured ${label}`);
}

await browser.close();
