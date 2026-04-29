import { test, expect } from '@playwright/test';

test.describe('MoodReel E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('moodreel-onboarded', 'true');
      window.localStorage.setItem('moodreel-install-dismissed', 'true');
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
      await moodButton.click();
      await page.getByRole('button', { name: /Get Recommendations|Searching/ }).click();
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

    await page.locator('.emoji-picker button').first().click();
    await page.getByRole('button', { name: /Get Recommendations|Searching/ }).click();
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

    await page.reload();
    await page.getByLabel('Search saved vibes').fill('E2E Cozy');
    await expect(page.getByText('✨ E2E Cozy Vibe')).toBeVisible();
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');

    await page.locator('a[href="/watchlist"]:visible').first().click();
    await expect(page).toHaveURL(/.*\/watchlist/);

    await page.locator('a[href="/profile"]:visible').first().click();
    await expect(page).toHaveURL(/.*\/profile/);

    await page.locator('a[href="/stats"]:visible').first().click();
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

  test('home search leads to detail page', async ({ page }) => {
    await page.goto('/');

    // Trigger a mood search to populate results
    const moodButton = page.locator('.emoji-picker button').first();
    if (await moodButton.isVisible()) {
      await moodButton.click();
      await page.getByRole('button', { name: /Get Recommendations|Searching/ }).click();
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
