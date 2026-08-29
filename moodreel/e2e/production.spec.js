import { test, expect } from '@playwright/test';
import { installTonightTmdbMocks } from './fixtures/tmdb.js';

/**
 * Behaviour that only exists in a production build, run against `vite preview`.
 *
 * The dev server serves `import.meta.env.DEV`, so it never takes the
 * same-origin proxy path and never applies the deployed Content-Security-
 * Policy. That blind spot is why a broken production transport reached the
 * live site: the app looked healthy in every dev-mode check.
 */
test.describe('production build', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('moodreel-onboarded', 'true');
      window.localStorage.setItem('moodreel-install-dismissed', 'true');
    });
  });

  test('routes catalog requests through the same-origin proxy', async ({ page }) => {
    const requested = [];
    await page.route('**/api/tmdb**', async route => {
      requested.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [], genres: [] }),
      });
    });
    // Any direct call to TMDB is a regression: the deployed CSP blocks it.
    const direct = [];
    await page.route('https://api.themoviedb.org/**', async route => {
      direct.push(route.request().url());
      await route.abort();
    });

    await page.goto('/');
    await expect.poll(() => requested.length, { timeout: 15000 }).toBeGreaterThan(0);
    expect(direct).toEqual([]);
  });

  test('a deployment whose proxy has no server key says so plainly', async ({ page }) => {
    // Reproduces a real production state: /api/tmdb is reachable but the
    // deployment has no TMDB_API_KEY, so every catalog request fails.
    await page.route('**/api/tmdb**', route =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          status_code: 503,
          status_message: 'TMDB proxy is not configured.',
          code: 'PROXY_NOT_CONFIGURED',
        }),
      })
    );

    await page.goto('/');

    const banner = page.getByRole('alert').filter({ hasText: 'Catalog unavailable' });
    await expect(banner).toBeVisible({ timeout: 15000 });
    await expect(banner).toContainText('no TMDB key configured on the server');
    // Offering a personal key here would be a dead end under the deployed CSP.
    await expect(banner.getByRole('link', { name: /Set a local key/ })).toHaveCount(0);
  });

  test('does not embed a TMDB key in the client bundle', async ({ page, request }) => {
    await installTonightTmdbMocks(page);
    await page.goto('/');

    const scripts = await page
      .locator('script[src]')
      .evaluateAll(nodes => nodes.map(node => node.getAttribute('src')));
    expect(scripts.length).toBeGreaterThan(0);

    for (const src of scripts) {
      const body = await (await request.get(src)).text();
      // A TMDB v3 key is a 32-character hex string. None should ever ship.
      expect(body).not.toMatch(/\bapi_key["':=\s]+[0-9a-f]{32}\b/);
    }
  });
});
