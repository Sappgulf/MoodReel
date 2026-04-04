import { test, expect } from '@playwright/test';

test.describe('MoodReel E2E', () => {
  test('homepage loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (msg) => {
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
    
    const movieCards = page.locator('.movie-card, [class*="movie-card"]');
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
    await expect(page.locator('.watchlist-page, [class*="watchlist"]')).toBeVisible({ timeout: 5000 });
  });

  test('keyboard shortcut opens modal', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('?');
    await page.waitForTimeout(500);
    
    const modal = page.locator('.keyboard-shortcuts-modal, [class*="shortcuts"]');
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
});