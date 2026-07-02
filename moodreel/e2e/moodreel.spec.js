import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
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

    await page.getByRole('button', { name: 'Finish onboarding' }).click();
    await expect(onboarding).toBeHidden();
    await expect(page.locator('h1')).toContainText('MoodReel');
  });

  test('onboarding starter preferences are persisted', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('moodreel-onboarded');
      window.localStorage.removeItem('moodreel-my-services');
      window.localStorage.removeItem('moodreel-taste-settings');
      window.localStorage.setItem('moodreel-install-dismissed', 'true');
    });

    await page.goto('/');
    for (let i = 0; i < 3; i += 1) {
      await page.getByRole('button', { name: 'Next →' }).click();
    }

    await page.getByLabel('Format').selectOption('movie');
    await page.getByLabel('Runtime').selectOption('90');
    await page.getByLabel('Avoid horror').check();
    await page.getByLabel('Starter preferences').getByRole('button', { name: 'Netflix' }).click();
    await page.getByRole('button', { name: 'Next →' }).click();
    await page.getByRole('button', { name: 'Finish onboarding' }).click();

    await expect
      .poll(() =>
        page.evaluate(() => ({
          onboarded: localStorage.getItem('moodreel-onboarded'),
          services: JSON.parse(localStorage.getItem('moodreel-my-services') || '[]'),
          taste: JSON.parse(localStorage.getItem('moodreel-taste-settings') || '{}'),
        }))
      )
      .toEqual({
        onboarded: 'true',
        services: [8],
        taste: {
          contentType: 'movie',
          maxRuntime: 90,
          avoidHorror: true,
          hiddenGemBias: false,
          preferredDecades: [],
        },
      });
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
    await expect(page.getByLabel('Why it ranked')).toHaveCount(3);
    await expect(page.getByText('Decision score')).toHaveCount(3);
    await expect(page.getByText('Why this pick?')).toHaveCount(3);
    await expect(page.getByRole('button', { name: /Share or copy/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why each pick wins' })).toBeVisible();
    await expect(page.locator('.tonight-compare-grid article')).toHaveCount(3);
    await expect(page.locator('.vite-error-overlay, [data-nextjs-dialog-overlay]')).toHaveCount(0);
  });

  test('title search respects taste profile ranking', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'moodreel-taste-profile',
        JSON.stringify({
          liked: ['102-movie'],
          disliked: ['101-movie'],
        })
      );
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Search all' }).click();
    await page.locator('#title-search-input').fill('zz');
    await expect(page.locator('.swipe-card, .recommendations .recommendation').first()).toBeVisible(
      {
        timeout: 10000,
      }
    );

    await expect(
      page.locator('.recommendations .recommendation h2, .swipe-card h3').first()
    ).toHaveText('Gold Room Mystery');
    await expect(
      page.locator('.recommendations .recommendation h2, .swipe-card h3').first()
    ).not.toHaveText('Cozy Signal');
  });

  test('main routes expose stable route-specific structure', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('MoodReel');

    await page.goto('/tonight');
    await expect(page.getByRole('heading', { name: /Find what to watch tonight/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Find Tonight's Picks/i })).toBeVisible();

    await page.goto('/stats');
    await expect(page.locator('h1')).toContainText('MoodReel');
    await expect(page.locator('#main-content')).toContainText('Your Watch Stats');

    await page.goto('/profile');
    await expect(page.locator('main')).toContainText('Privacy & Local Data');

    await page.goto('/calendar');
    await expect(page.locator('#main-content')).toBeVisible();
    await page.goto('/achievements');
    await expect(page.locator('#main-content')).toBeVisible();
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

  test('empty watchlist keeps the next action in view', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('moodreel_watchlist');
      window.localStorage.removeItem('moodreel_favorites');
    });

    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: 'Your watchlist is empty' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Discover Movies' })).toBeInViewport();
    await expect(page.getByRole('group', { name: 'Watchlist layout' })).toHaveCount(0);
  });

  test('watchlist lanes, notes, watched state, and matchmaker work', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'moodreel_watchlist',
        JSON.stringify([
          {
            id: 101,
            media_type: 'movie',
            title: 'Cozy Signal',
            genre_ids: [35, 10751],
            vote_average: 7.8,
            poster_path: '/cozy-signal.jpg',
            release_date: '2024-02-02',
            addedAt: 3,
          },
          {
            id: 102,
            media_type: 'movie',
            title: 'Gold Room Mystery',
            genre_ids: [9648, 53],
            vote_average: 7.4,
            poster_path: '/gold-room.jpg',
            release_date: '2023-10-13',
            addedAt: 2,
          },
          {
            id: 103,
            media_type: 'movie',
            title: 'Left Turn Cinema',
            genre_ids: [878, 35],
            vote_average: 7.1,
            poster_path: '/left-turn.jpg',
            release_date: '2022-06-17',
            addedAt: 1,
          },
        ])
      );
    });

    await page.goto('/watchlist');
    await expect(page.getByRole('group', { name: 'Watchlist priority lanes' })).toBeVisible();
    await page.getByRole('button', { name: /With friends/ }).click();
    await expect(page.locator('.watchlist-item')).toHaveCount(2);

    await page.getByRole('button', { name: 'Film Log' }).click();
    await expect(page.locator('.watchlist-grid-rows')).toBeVisible();

    await page.getByRole('button', { name: '+ Add note' }).first().click();
    await page.locator('.note-editor textarea').fill('Save for Friday night.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Save for Friday night.')).toBeVisible();

    await page
      .getByRole('button', { name: /Mark as watched/i })
      .first()
      .click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.keys(JSON.parse(localStorage.getItem('moodreel_watched') || '{}'))
        )
      )
      .toHaveLength(1);

    await page
      .getByRole('group', { name: 'Watchlist priority lanes' })
      .getByRole('button', { name: /All/ })
      .click();
    await page.getByRole('button', { name: 'Matchmaker' }).click();
    await page.getByPlaceholder("Paste friend's watchlist here...").fill('Cozy Signal');
    await page.getByRole('button', { name: 'Find Matches' }).click();
    await expect(page.getByText('Found 1 movie in common!')).toBeVisible();
  });

  test('profile exposes local privacy controls', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: /Privacy & Local Data/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export data' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import backup' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset local data' })).toBeVisible();
  });

  test('profile local TMDB key controls save and test failures clearly', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('moodreel-tmdb-api-key');
    });
    await page.route('https://api.themoviedb.org/3/configuration**', route =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ status_message: 'Invalid API key' }),
      })
    );

    await page.goto('/profile');
    const apiKeyInput = page.getByLabel('TMDB API key');
    const saveButton = page.getByRole('button', { name: 'Save local key' });
    const testButton = page.getByRole('button', { name: 'Test connection' });

    await expect(saveButton).toBeDisabled();
    await expect(testButton).toBeDisabled();

    await apiKeyInput.fill('bad-local-key');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(testButton).toBeEnabled();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('moodreel-tmdb-api-key')))
      .toBe('bad-local-key');

    await testButton.click();
    await expect(page.locator('.api-key-test-status.fail')).toContainText(
      'TMDB rejected this key.'
    );
  });

  test('profile export omits API keys and rejects invalid backups', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('moodreel_watchlist', JSON.stringify([{ id: 101 }]));
      window.localStorage.setItem('moodreel-tmdb-api-key', 'secret-key');
    });

    await page.goto('/profile');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export data' }).click();
    const download = await downloadPromise;
    const exportPath = await download.path();
    const exportText = await fs.readFile(exportPath, 'utf8');
    const exportJson = JSON.parse(exportText);

    expect(exportJson.payload['moodreel_watchlist']).toBe(JSON.stringify([{ id: 101 }]));
    expect(exportJson.payload['moodreel-tmdb-api-key']).toBeUndefined();

    await page.setInputFiles('input[aria-label="Import MoodReel backup file"]', {
      name: 'not-moodreel.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ app: 'Other', payload: {} })),
    });
    await expect(page.getByText('Import failed')).toBeVisible();
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

  test('detail page supports taste, rating, review, and share controls', async ({ page }) => {
    await page.goto('/movie/101');
    await expect(page.locator('.movie-details')).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel('Detail score')).toBeVisible();
    await expect(page.locator('.shareable-vibe-card')).toBeVisible();

    await page.getByRole('button', { name: /Add to Watchlist/ }).click();
    await expect(page.getByRole('button', { name: /In Watchlist/ })).toBeVisible();
    await page.getByRole('button', { name: /Mark as Watched/ }).click();
    await expect(page.getByRole('button', { name: /Watched/ })).toBeVisible();

    await page
      .getByRole('group', { name: 'Taste profile' })
      .getByRole('button', { name: '👍 Like' })
      .click();
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('moodreel-taste-profile'))))
      .toMatchObject({ liked: ['101-movie'] });

    await page.getByRole('button', { name: '4 stars' }).click();
    await page.getByRole('button', { name: /Write a Review/ }).click();
    await page.getByPlaceholder('What did you think of this movie?').fill('Great couch pick.');
    await page.getByRole('button', { name: 'Save Review' }).click();
    await expect(page.getByText('"Great couch pick."')).toBeVisible();

    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.getByRole('button', { name: 'Link copied!' })).toBeVisible();
  });

  test('PWA manifest exposes installable shell metadata', async ({ page, request }) => {
    await page.goto('/');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBe('/manifest.json');

    const manifest = await (await request.get(manifestHref)).json();
    expect(manifest.name).toBe('MoodReel');
    expect(manifest.description).toContain('movies and TV shows');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
        expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
        expect.objectContaining({ purpose: 'maskable' }),
      ])
    );
  });
});
