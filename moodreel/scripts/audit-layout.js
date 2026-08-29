/**
 * Detect layout breakage across routes, themes, and viewports.
 *
 *   npm run audit:layout
 *
 * Catches the classes of bug that are invisible to unit tests and easy to miss
 * by eye on a long page:
 *
 *  - overflow:   the page scrolls horizontally
 *  - crushed:    a text element squeezed so narrow its content cannot render
 *                (e.g. a grid child that auto-placed into one column)
 *  - clipped:    text overflowing its own box
 *  - overlap:    two text elements drawn on top of each other
 *  - tiny-target: interactive controls below the 24px minimum touch size
 *
 * Exits non-zero when anything is found, so it can gate CI.
 */
import { chromium } from '@playwright/test';
import { installTonightTmdbMocks } from '../e2e/fixtures/tmdb.js';

const BASE_URL = process.env.LAYOUT_BASE_URL || 'http://localhost:3000';

const ROUTES = ['/', '/tonight', '/watchlist', '/profile', '/stats', '/achievements', '/calendar'];
const THEMES = ['dark', 'light'];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'laptop', width: 1280, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
];

/** Runs in the page. Returns plain data only. */
function collectLayoutProblems() {
  const problems = [];
  const seen = new Set();

  const describe = el => {
    const id = el.id ? `#${el.id}` : '';
    const cls =
      typeof el.className === 'string' && el.className
        ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
        : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  const add = (type, el, detail) => {
    const key = `${type}|${describe(el)}|${detail}`;
    if (seen.has(key)) return;
    seen.add(key);
    problems.push({ type, element: describe(el), detail });
  };

  const doc = document.documentElement;
  if (doc.scrollWidth > doc.clientWidth + 1) {
    problems.push({
      type: 'overflow',
      element: 'html',
      detail: `page scrolls horizontally: ${doc.scrollWidth}px content in ${doc.clientWidth}px viewport`,
    });
  }

  const isVisible = el => {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  /**
   * True when an element sits inside a fixed or sticky container. Those are
   * deliberately layered over the scrolling page (the bottom nav, the header,
   * modals), so they are expected to cover content and must not be reported
   * as overlaps.
   */
  const isLayered = el => {
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      const position = getComputedStyle(node).position;
      if (position === 'fixed' || position === 'sticky') return true;
    }
    return false;
  };

  const textElements = [];

  for (const el of document.querySelectorAll('body *')) {
    if (!isVisible(el)) continue;
    const rect = el.getBoundingClientRect();

    // Elements whose own text is their only content.
    const ownText = [...el.childNodes]
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent.trim())
      .join(' ');

    if (ownText.length > 2) {
      if (!isLayered(el)) textElements.push({ el, rect, text: ownText });

      // A text box narrower than a few characters cannot be showing its text.
      const fontSize = parseFloat(getComputedStyle(el).fontSize) || 16;
      if (rect.width > 0 && rect.width < fontSize * 2.5 && ownText.length > 6) {
        add('crushed', el, `${Math.round(rect.width)}px wide for ${ownText.length} chars`);
      }

      // Text spilling out of its own box.
      if (
        el.scrollWidth > el.clientWidth + 2 &&
        getComputedStyle(el).overflow === 'visible' &&
        getComputedStyle(el).whiteSpace !== 'nowrap'
      ) {
        add('clipped', el, `content ${el.scrollWidth}px in ${el.clientWidth}px box`);
      }
    }

    // Interactive targets that are too small to hit reliably.
    const interactive = el.matches('button, a[href], input, select, [role="button"]');
    if (interactive && (rect.width < 24 || rect.height < 24)) {
      add('tiny-target', el, `${Math.round(rect.width)}x${Math.round(rect.height)}px`);
    }
  }

  // Overlapping text: two leaf text boxes sharing space.
  for (let i = 0; i < textElements.length; i += 1) {
    for (let j = i + 1; j < textElements.length; j += 1) {
      const a = textElements[i];
      const b = textElements[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;

      const overlapWidth =
        Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const overlapHeight =
        Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (overlapWidth <= 2 || overlapHeight <= 2) continue;

      const smaller = Math.min(a.rect.width * a.rect.height, b.rect.width * b.rect.height);
      // Only report a substantial collision, so incidental 1px touches are ignored.
      if (smaller > 0 && (overlapWidth * overlapHeight) / smaller > 0.35) {
        add('overlap', a.el, `overlaps ${describe(b.el)}`);
      }
    }
  }

  return problems;
}

async function main() {
  const browser = await chromium.launch();
  const findings = [];

  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
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
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        const problems = await page.evaluate(collectLayoutProblems);
        for (const problem of problems) {
          findings.push({ ...problem, route, theme, viewport: viewport.name });
        }
      }

      await context.close();
    }
  }

  await browser.close();

  if (findings.length === 0) {
    console.log('No layout problems found.');
    return;
  }

  // One underlying bug usually shows up on many routes; group so the output
  // reads as a list of problems rather than a list of sightings.
  const grouped = new Map();
  for (const finding of findings) {
    const key = `${finding.type}|${finding.element}|${finding.detail}`;
    const entry = grouped.get(key) || { ...finding, where: new Set() };
    entry.where.add(`${finding.route} ${finding.viewport}/${finding.theme}`);
    grouped.set(key, entry);
  }

  const rows = [...grouped.values()].sort((a, b) => b.where.size - a.where.size);
  console.log(`Found ${rows.length} distinct layout problems:\n`);
  for (const row of rows) {
    console.log(`[${row.type}] ${row.element}`);
    console.log(`  ${row.detail}`);
    console.log(
      `  seen on: ${[...row.where].slice(0, 6).join(', ')}${row.where.size > 6 ? ` (+${row.where.size - 6} more)` : ''}\n`
    );
  }

  process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
