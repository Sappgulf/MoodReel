import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  clearProviderCache,
  fetchTitleProviders,
  getCachedTitleProviders,
} from './providerService';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../test/fixtures');
const fixtures = JSON.parse(readFileSync(join(fixturesDir, 'tmdb-watch-providers.json'), 'utf8'));

vi.mock('./apiClient', () => ({
  tmdbGet: vi.fn(),
  ensureArray: vi.fn(v => (Array.isArray(v) ? v : [])),
}));

import { tmdbGet } from './apiClient';

describe('providerService', () => {
  beforeEach(() => {
    clearProviderCache();
    vi.clearAllMocks();
  });

  it('normalizes TMDB watch-provider fixture responses', async () => {
    tmdbGet.mockResolvedValueOnce({
      results: { US: fixtures.movie_us_netflix },
    });

    const data = await fetchTitleProviders(1, 'movie', 'US');
    expect(data.flatrate[0]).toMatchObject({ id: 8, name: 'Netflix' });
    expect(getCachedTitleProviders(1, 'movie', 'US')).toEqual(data);
  });

  it('caches multi-provider fixture payloads', async () => {
    tmdbGet.mockResolvedValueOnce({
      results: { US: fixtures.movie_us_multi },
    });

    const data = await fetchTitleProviders(2, 'movie', 'US');
    expect(data.flatrate.map(p => p.id)).toContain(337);
    expect(tmdbGet).toHaveBeenCalledTimes(1);

    await fetchTitleProviders(2, 'movie', 'US');
    expect(tmdbGet).toHaveBeenCalledTimes(1);
  });
});
