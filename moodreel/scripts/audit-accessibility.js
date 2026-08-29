/**
 * Run an axe-core accessibility audit across the main routes, in both themes,
 * against the deterministic TMDB fixtures used by the e2e suite.
 *
 *   npm run a11y
 *
 * Exits non-zero if any violation is found, so it can gate CI.
 */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { installTonightTmdbMocks } from '../e2e/fixtures/tmdb.js';

const BASE_URL = process.env.A11Y_BASE_URL || 'http://localhost:3000';

const ROUTES = ['/', '/tonight', '/watchlist', '/profile', '/stats', '/achievements', '/calendar'];
const THEMES = ['dark', 'light'];

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function auditRoute(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
  // Let route content mount before scanning, so we audit the real page
  // rather than its Suspense fallback.
  await page.waitForTimeout(500);
  return new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
}

async function main() {
  const browser = await chromium.launch();
  const findings = [];

  for (const theme of THEMES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
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
      const results = await auditRoute(page, route);
      for (const violation of results.violations) {
        findings.push({ theme, route, violation });
      }
    }

    await context.close();
  }

  await browser.close();

  if (findings.length === 0) {
    console.log('No WCAG 2.1 A/AA violations found.');
    return;
  }

  // Group identical rules so one systemic issue reads as one problem.
  const byRule = new Map();
  for (const { theme, route, violation } of findings) {
    const entry = byRule.get(violation.id) || {
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: 0,
      where: new Set(),
      samples: new Set(),
    };
    entry.nodes += violation.nodes.length;
    entry.where.add(`${route} (${theme})`);
    for (const node of violation.nodes) {
      // The last line of the failure summary carries the concrete numbers
      // (measured ratio, the two colours, and the required threshold).
      const detail = (node.failureSummary || '').split('\n').filter(Boolean).pop() || '';
      entry.samples.add(`${node.target.join(' ')} :: ${detail.trim()}`);
    }
    byRule.set(violation.id, entry);
  }

  const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const rules = [...byRule.values()].sort(
    (a, b) => (order[a.impact] ?? 9) - (order[b.impact] ?? 9) || b.nodes - a.nodes
  );

  console.log(`Found ${rules.length} distinct rule violations:\n`);
  for (const rule of rules) {
    console.log(`[${rule.impact}] ${rule.id} — ${rule.help}`);
    console.log(`  nodes: ${rule.nodes}`);
    console.log(`  where: ${[...rule.where].join(', ')}`);
    for (const sample of rule.samples) console.log(`  - ${sample}`);
    console.log(`  docs:  ${rule.helpUrl}\n`);
  }

  process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
