import { test, expect } from '@playwright/test';
import { installTonightTmdbMocks } from './fixtures/tmdb';

test.describe('MoodReel E2E', () => {
  const runMoodSearch = async page => {
    await page.locator('.emoji-picker button').first().click();
    await page
      .getByRole('button', { name: /Discover|Refresh Results|Searching/ })
      .first()
      .click();
  };

  test.beforeEach(async ({ page }) => {
    await installTonightTmdbMocks(page);
    await page.addInitScript(() => {
      window.localStorage.setItem('moodreel-onboarded', 'true');
      window.localStorage.setItem('moodreel-install-dismissed', 'true');
      window.localStorage.setItem('moodreel-tmdb-api-key', 'test-key');
    });
  });

  test('homepage loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.locator('h1')).toContainText('MoodReel');
    await expect(
      page.locator('nav[aria-label="Primary navigation"]:visible').first()
    ).toBeVisible();

    const criticalErrors = errors.filter(e => !e.includes('Warning') && !e.includes('deprecat'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('first-run onboarding can be completed', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('moodreel-onboarded');
      window.localStorage.setItem('moodreel-install-dismissed', 'true');
    });

    await page.goto('/');
    const onboarding = page.getByRole('dialog', { name: /Welcome to MoodReel/ });
    await expect(onboarding).toBeVisible();

    for (let i = 0; i < 4; i += 1) {
      await page.getByRole('button', { name: 'Next →' }).click();
    }

    await page.getByRole('button', { name: /Let's Go/ }).click();
    await expect(onboarding).toBeHidden();
    await expect(page.locator('h1')).toContainText('MoodReel');
  });

  test('mood selection updates results', async ({ page }) => {
    await page.goto('/');

    const moodButton = page.locator('.emoji-picker button').first();
    if (await moodButton.isVisible()) {
      await runMoodSearch(page);
    }

    const resultCard = page.locator('.recommendation, .swipe-card').first();
    await expect(resultCard).toBeVisible({ timeout: 15000 });
  });

  test('save vibe modal stores a custom vibe', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'Mobile Safari',
      'Save Vibe lives in the desktop results header.'
    );

    await page.goto('/');

    await runMoodSearch(page);
    await expect(page.locator('.recommendation, .swipe-card').first()).toBeVisible({
      timeout: 15000,
    });

    await page
      .getByRole('button', { name: /Save Vibe/ })
      .first()
      .click();
    const modal = page.getByRole('dialog', { name: /Name your custom discovery mix/ });
    await expect(modal).toBeVisible();
    await modal.getByLabel('Vibe name').fill('E2E Cozy Vibe');
    await modal.getByRole('button', { name: 'Save Vibe', exact: true }).click();
    await expect(modal).toBeHidden();

    await expect
      .poll(() =>
        page.evaluate(() => {
          const saved = JSON.parse(localStorage.getItem('moodreel-custom-playlists') || '[]');
          return saved.some(playlist => playlist.name === 'E2E Cozy Vibe');
        })
      )
      .toBe(true);
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');

    await page.locator('a[href="/tonight"]:visible').first().click();
    await expect(page).toHaveURL(/.*\/tonight/);

    await page.locator('a[href="/watchlist"]:visible').first().click();
    await expect(page).toHaveURL(/.*\/watchlist/);

    await page.locator('a[href="/profile"]:visible').first().click();
    await expect(page).toHaveURL(/.*\/profile/);

    await page.locator('a[href="/stats"]:visible').first().click();
    await expect(page).toHaveURL(/.*\/stats/);
  });

  test('main app routes render meaningful screens', async ({ page }) => {
    const routes = [
      '/',
      '/watchlist',
      '/tonight',
      '/stats',
      '/calendar',
      '/profile',
      '/achievements',
      '/404',
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('#main-content')).toContainText(
        /MoodReel|Tonight|Watchlist|Stats|Calendar|Profile|Achievements|Page not found/i
      );
      await expect(page.locator('.vite-error-overlay, [data-nextjs-dialog-overlay]')).toHaveCount(
        0
      );
    }
  });

  test('tonight mode returns three explained mocked picks', async ({ page }) => {
    await page.goto('/tonight');
    await page.getByRole('button', { name: 'Netflix' }).click();
    await page.getByLabel('Services-only').check();
    await page.getByRole('button', { name: "Find Tonight's Picks" }).click();

    await expect(page.locator('.tonight-pick-card')).toHaveCount(3, { timeout: 15000 });
    await expect(page.locator('.tonight-pick-slot')).toHaveText([
      'Safe Bet',
      'Best Match',
      'Wild Card',
    ]);
    await expect(page.getByText('Why this pick?')).toHaveCount(3);
    await expect(page.getByRole('button', { name: /Share or copy/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why each pick wins' })).toBeVisible();
    await expect(page.locator('.tonight-compare-grid article')).toHaveCount(3);
    await expect(page.locator('.vite-error-overlay, [data-nextjs-dialog-overlay]')).toHaveCount(0);
  });

  test('pick between these locks a home shortlist title', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'Mobile Safari',
      'Pick Between These lives in the desktop results panel.'
    );

    await page.goto('/');
    await page.locator('.emoji-picker button').first().click();
    await page.getByRole('button', { name: "Find Tonight's Picks" }).click();
    await expect(page.locator('.pick-between-card')).toHaveCount(3, { timeout: 15000 });
    await page.getByRole('button', { name: 'Pick this' }).first().click();
    await expect(page.locator('.pick-between-card.locked').first()).toBeVisible();
    await expect(page.getByText("Tonight's pick locked")).toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/');

    const themeToggle = page.locator('.theme-toggle');
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();
    await page.waitForTimeout(300);

    await themeToggle.click();
    await page.waitForTimeout(300);
  });

  test('watchlist page loads', async ({ page }) => {
    await page.goto('/watchlist');
    await expect(page.locator('.watchlist-page')).toBeVisible({
      timeout: 5000,
    });
  });

  test('profile exposes local privacy controls', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: /Privacy & Local Data/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export data' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import backup' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset local data' })).toBeVisible();
  });

  test('keyboard shortcut opens modal', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'Mobile Safari', 'Keyboard shortcuts are desktop-only.');

    await page.goto('/');

    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
    });
    await page.waitForTimeout(500);

    const modal = page.getByRole('dialog', { name: /Keyboard Shortcuts/ });
    await expect(modal).toBeVisible({ timeout: 2000 });
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('mobile bottom nav is visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const bottomNav = page.locator('.mobile-bottom-nav');
    if (await bottomNav.isVisible()) {
      await expect(bottomNav.locator('.bottom-nav-item')).toHaveCount(5);
    }
  });

  test('mobile swipe stack supports rejecting a result', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await runMoodSearch(page);
    const swipeCard = page.locator('.swipe-card').first();
    await expect(swipeCard).toBeVisible({ timeout: 15000 });
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.swipe-card, .empty-state').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('home search leads to detail page', async ({ page }) => {
    await page.goto('/');

    // Trigger a mood search to populate results
    const moodButton = page.locator('.emoji-picker button').first();
    if (await moodButton.isVisible()) {
      await runMoodSearch(page);
    }

    // Wait for at least one recommendation card
    const cardLink = page.locator('.recommendation a, .swipe-card a').first();
    await expect(cardLink).toBeVisible({ timeout: 15000 });

    // Click through to the detail page
    await cardLink.click();
    await page.waitForURL(/\/(movie|tv)\/\d+/, { timeout: 10000 });

    // Verify detail page rendered key sections
    await expect(page.locator('.movie-details')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Cast' })).toBeVisible();
  });
});
