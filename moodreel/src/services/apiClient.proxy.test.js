import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { getApiKeyStatus, tmdbGet } from './apiClient';

// These cases exercise the production transport, where the same-origin proxy
// is the only viable path. They live in their own file because module-level
// proxy state must start clean, and Vitest isolates the module registry per
// test file.
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    isCancel: vi.fn(() => false),
  },
}));

describe('apiClient proxy configuration reporting', () => {
  beforeEach(() => {
    window.localStorage.getItem.mockImplementation(() => null);
    axios.get.mockReset();
    vi.stubEnv('VITE_TMDB_API_KEY', '');
    vi.stubEnv('REACT_APP_TMDB_API_KEY', '');
    // Production build: shouldUseProxy() routes everything through /api/tmdb.
    vi.stubEnv('DEV', false);
  });

  const notConfigured = {
    response: {
      status: 503,
      data: { status_code: 503, code: 'PROXY_NOT_CONFIGURED' },
      headers: {},
    },
  };

  it('reports the proxy as configured until told otherwise', () => {
    expect(getApiKeyStatus()).toMatchObject({ configured: true, source: 'proxy' });
  });

  it('does not retry a proxy that reports it has no key', async () => {
    axios.get.mockRejectedValue(notConfigured);

    await expect(tmdbGet('/trending/all/day', { retries: 3 })).rejects.toThrow();

    // A 503 is normally retryable, but this one cannot fix itself.
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('stops claiming to be configured once the proxy reports it has no key', async () => {
    axios.get.mockRejectedValue(notConfigured);

    await expect(tmdbGet('/trending/all/day', { retries: 0 })).rejects.toThrow();

    // The deployment is missing its server-side key, so the app must say so
    // rather than report a working setup while every request fails silently.
    expect(getApiKeyStatus()).toMatchObject({
      configured: false,
      source: 'missing',
      // A visitor cannot fix a deployment's missing server key with their own.
      proxyUnconfigured: true,
    });
  });
});
