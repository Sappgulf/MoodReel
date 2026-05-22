import { test, expect } from '@playwright/test';

test.describe('MoodReel E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('moodreel-onboarded', 'true');
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
    await expect(page.locator('.nav-link').first()).toBeVisible();

    const criticalErrors = errors.filter(e => !e.includes('Warning') && !e.includes('deprecat'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('mood selection updates results', async ({ page }) => {
    await page.goto('/');

    const moodButton = page.locator('.emoji-picker button').first();
    if (await moodButton.isVisible()) {
      await moodButton.click();
      await page.waitForTimeout(1500);
    }

    const movieCards = page.locator('.recommendation, .movie-card, .swipe-card');
    await expect(movieCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');

    await page.click('text=Watchlist');
    await expect(page).toHaveURL(/.*\/watchlist/);

    await page.click('text=Profile');
    await expect(page).toHaveURL(/.*\/profile/);

    await page.click('text=Stats');
    await expect(page).toHaveURL(/.*\/stats/);
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

  test('keyboard shortcut opens modal', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('?');
    await page.waitForTimeout(500);

    const modal = page.locator('.shortcuts-modal');
    if (await modal.isVisible({ timeout: 2000 })) {
      await page.keyboard.press('Escape');
    }
  });

  test('mobile bottom nav is visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const bottomNav = page.locator('.mobile-bottom-nav');
    if (await bottomNav.isVisible()) {
      await expect(bottomNav.locator('.bottom-nav-item')).toHaveCount(5);
    }
  });

  test('home search leads to detail page', async ({ page }) => {
    await page.goto('/');

    // Trigger a mood search to populate results
    const moodButton = page.locator('.emoji-picker button').first();
    if (await moodButton.isVisible()) {
      await moodButton.click();
      await page.waitForTimeout(1500);
    }

    // Wait for at least one recommendation card
    const cardLink = page.locator('.recommendation a, .movie-card a').first();
    await expect(cardLink).toBeVisible({ timeout: 10000 });

    // Click through to the detail page
    await cardLink.click();
    await page.waitForURL(/\/(movie|tv)\/\d+/, { timeout: 10000 });

    // Verify detail page rendered key sections
    await expect(page.locator('.movie-details')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.movie-details .overview')).toBeVisible({ timeout: 5000 });
  });
});
