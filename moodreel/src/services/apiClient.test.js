import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { getApiKeyStatus, saveUserApiKey, testTmdbConnection, tmdbGet } from './apiClient';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    isCancel: vi.fn(() => false),
  },
}));

describe('apiClient API key routing', () => {
  let storage;

  beforeEach(() => {
    storage = new Map();
    window.localStorage.getItem.mockImplementation(key =>
      storage.has(key) ? storage.get(key) : null
    );
    window.localStorage.setItem.mockImplementation((key, value) => {
      storage.set(key, String(value));
    });
    window.localStorage.removeItem.mockImplementation(key => {
      storage.delete(key);
    });
    axios.get.mockReset();
  });

  it('uses a saved browser key instead of the proxy path', async () => {
    saveUserApiKey('user-key');
    axios.get.mockResolvedValueOnce({ data: { results: [] } });

    expect(getApiKeyStatus()).toMatchObject({
      configured: true,
      source: 'user',
      value: 'user-key',
    });

    await tmdbGet('/search/movie', {
      params: { query: 'heat' },
      retries: 0,
    });

    expect(axios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/search/movie',
      expect.objectContaining({
        params: expect.objectContaining({
          api_key: 'user-key',
          query: 'heat',
        }),
      })
    );
  });

  it('reports a missing key in local dev when no client key exists', () => {
    expect(getApiKeyStatus()).toMatchObject({
      configured: false,
      source: 'missing',
      value: null,
    });
  });

  it('tests the TMDB connection against the lightweight configuration endpoint', async () => {
    saveUserApiKey('user-key');
    axios.get.mockResolvedValueOnce({ data: { images: {} } });

    await expect(testTmdbConnection()).resolves.toBe(true);

    expect(axios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/configuration',
      expect.objectContaining({
        params: expect.objectContaining({
          api_key: 'user-key',
        }),
      })
    );
  });
});
