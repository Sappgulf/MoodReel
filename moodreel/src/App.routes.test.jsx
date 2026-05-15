import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

vi.mock('./services/apiClient', () => ({
  clearUserApiKey: vi.fn(),
  ensureArray: vi.fn(value => (Array.isArray(value) ? value : [])),
  ensureNumber: vi.fn((value, fallback = 0) => (Number.isFinite(value) ? value : fallback)),
  ensureString: vi.fn((value, fallback = '') => (typeof value === 'string' ? value : fallback)),
  getApiKeyStatus: vi.fn(() => ({
    configured: true,
    source: 'test',
    value: 'test-key',
    hasKey: true,
  })),
  saveUserApiKey: vi.fn(() => true),
  tmdbGet: vi.fn(async path => {
    if (path.includes('/genre/')) return { genres: [] };
    if (path.includes('/watch/providers')) return { results: [] };
    return { results: [], page: 1, total_pages: 1, total_results: 0 };
  }),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  window.scrollTo = vi.fn();
  window.localStorage.getItem.mockImplementation(key => {
    if (key === 'moodreel-onboarded') return 'true';
    if (key === 'moodreel-install-dismissed') return 'true';
    return null;
  });
});

describe('route smoke coverage', () => {
  const routes = [
    '/',
    '/watchlist',
    '/tonight',
    '/stats',
    '/calendar',
    '/profile',
    '/achievements',
  ];

  it.each(routes)('renders %s without falling through to 404', async route => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    );

    await screen.findByRole('banner', { name: /main navigation/i });
    const main = document.getElementById('main-content');
    await waitFor(() => {
      expect(main.textContent.trim().length).toBeGreaterThan(20);
    });

    expect(screen.queryByText(/Page not found/i)).toBeNull();
  });

  it('renders the explicit 404 route', async () => {
    render(
      <MemoryRouter initialEntries={['/404']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Page not found/i)).toBeTruthy();
  });
});
