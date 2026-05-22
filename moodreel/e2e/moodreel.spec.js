import { test, expect } from '@playwright/test';
import { installTmdbMocks, prepareAppStorage } from './tmdbMock.js';

test.describe('MoodReel E2E', () => {
  test.beforeEach(async ({ page }) => {
    await installTmdbMocks(page);
    await prepareAppStorage(page);
  });

  test('homepage loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.locator('header h1')).toContainText('MoodReel');
    await expect(page.locator('.nav-link').first()).toBeVisible();

    const criticalErrors = errors.filter(
      e => !e.includes('Warning') && !e.includes('deprecat') && !e.includes('401')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('mood selection updates results', async ({ page }) => {
    await page.goto('/');

    const moodButton = page.locator('.emoji-picker button').first();
    await expect(moodButton).toBeVisible();
    await moodButton.click();

    await expect(page.locator('.recommendation').first()).toBeVisible({ timeout: 15000 });
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');

    await page
      .locator('.desktop-nav')
      .getByRole('link', { name: /Watchlist/i })
      .click();
    await expect(page).toHaveURL(/\/watchlist/);

    await page
      .locator('.desktop-nav')
      .getByRole('link', { name: /Profile/i })
      .click();
    await expect(page).toHaveURL(/\/profile/);

    await page.locator('.desktop-nav').getByRole('link', { name: /Stats/i }).click();
    await expect(page).toHaveURL(/\/stats/);
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/');

    const themeToggle = page.getByRole('button', { name: /Switch to/i });
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();
    await themeToggle.click();
  });

  test('watchlist page loads', async ({ page }) => {
    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: /Your Library/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('keyboard shortcut opens modal', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('?');
    const modal = page.getByRole('dialog', { name: /keyboard shortcuts/i });
    await expect(modal).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('mobile bottom nav is visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const bottomNav = page.locator('.mobile-bottom-nav');
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.locator('.bottom-nav-item')).toHaveCount(5);
  });

  test('skip link targets main content', async ({ page }) => {
    await page.goto('/');
    const skip = page.getByRole('link', { name: /Skip to main content/i });
    await expect(skip).toHaveAttribute('href', '#main-content');
    await skip.focus();
    await expect(skip).toBeFocused();
  });

  test('discover card opens movie detail route', async ({ page }) => {
    await page.goto('/');
    const cardLink = page.locator('.recommendation a[href^="/movie/"]').first();
    await expect(cardLink).toBeVisible({ timeout: 15000 });
    await cardLink.click();
    await expect(page).toHaveURL(/\/movie\/\d+/, { timeout: 15000 });
  });

  test('movie detail shows title and overview', async ({ page }) => {
    await page.goto('/movie/550');
    await expect(page.getByTestId('movie-details-ready')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Fight Club', level: 1 })).toBeVisible();
    await expect(page.locator('.overview')).toContainText(/fight club/i);
  });

  test('tonight mode page loads', async ({ page }) => {
    await page.goto('/tonight');
    await expect(page.getByRole('heading', { name: /Tonight Mode/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Get tonight picks/i })).toBeVisible();
  });
});
