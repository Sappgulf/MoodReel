import { vi, describe, it, expect, beforeEach } from 'vitest';
import { generateCacheKey, clearCache, getCacheStats, search } from './searchService';
import { canMakeRequest } from '../utils/rateLimiter';
import { tmdbGet } from './apiClient';

vi.mock('axios', () => ({
  get: vi.fn(),
  isCancel: vi.fn(),
}));

vi.mock('../utils/rateLimiter', () => ({
  canMakeRequest: vi.fn(() => true),
  getRemainingRequests: vi.fn(() => 30),
}));

vi.mock('../utils/moodParser', () => ({
  parseMoodToGenres: vi.fn(text => {
    if (text === 'happy') return [35];
    if (text === 'scary') return [27];
    return [];
  }),
}));

vi.mock('./apiClient', () => ({
  tmdbGet: vi.fn(),
  ensureArray: vi.fn(v => (Array.isArray(v) ? v : [])),
  ensureNumber: vi.fn((v, fallback = 0) => (Number.isFinite(v) ? v : fallback)),
  ensureString: vi.fn((v, fallback = '') => (typeof v === 'string' ? v : fallback)),
  isAbortError: vi.fn(() => false),
  isExpectedTmdbErrorForLogging: vi.fn(() => false),
  shouldSkipLog: vi.fn(() => false),
}));

describe('searchService', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  describe('generateCacheKey', () => {
    it('should normalize query to lowercase and trim', () => {
      const key1 = generateCacheKey({ query: '  Batman  ', type: 'movie' });
      const key2 = generateCacheKey({ query: 'batman', type: 'movie' });
      expect(key1).toBe(key2);
    });

    it('should produce same key regardless of genre/provider order', () => {
      const key1 = generateCacheKey({
        query: 'test',
        genres: [28, 12, 35],
        providers: [8, 337],
      });
      const key2 = generateCacheKey({
        query: 'test',
        genres: [35, 12, 28],
        providers: [337, 8],
      });
      expect(key1).toBe(key2);
    });

    it('should include all filter parameters in key', () => {
      const key = generateCacheKey({
        query: 'action',
        type: 'movie',
        page: 2,
        genres: [28],
        providers: [8],
        minRating: 7,
        yearMin: 2000,
        yearMax: 2023,
        sortBy: 'vote_average.desc',
      });

      const parsed = JSON.parse(key);
      expect(parsed.query).toBe('action');
      expect(parsed.type).toBe('movie');
      expect(parsed.page).toBe(2);
      expect(parsed.genres).toEqual([28]);
      expect(parsed.providers).toEqual([8]);
      expect(parsed.minRating).toBe(7);
      expect(parsed.yearMin).toBe(2000);
      expect(parsed.yearMax).toBe(2023);
      expect(parsed.sortBy).toBe('vote_average.desc');
    });

    it('should use defaults for missing parameters', () => {
      const key = generateCacheKey({ query: 'test' });
      const parsed = JSON.parse(key);

      expect(parsed.type).toBe('all');
      expect(parsed.page).toBe(1);
      expect(parsed.genres).toEqual([]);
      expect(parsed.providers).toEqual([]);
      expect(parsed.minRating).toBe(0);
      expect(parsed.yearMin).toBe(1900);
      expect(parsed.sortBy).toBe('popularity.desc');
      expect(parsed.region).toBe('US');
    });

    it('should handle empty query', () => {
      const key1 = generateCacheKey({ query: '' });
      const key2 = generateCacheKey({ query: '   ' });
      expect(key1).toBe(key2);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache size and inflight count', () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('inflight');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.inflight).toBe('number');
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      expect(getCacheStats().size).toBe(0);
      clearCache();
      expect(getCacheStats().size).toBe(0);
    });
  });

  describe('search caching', () => {
    it('returns cached results before consuming another rate-limit slot', async () => {
      tmdbGet.mockResolvedValue({
        results: [
          {
            id: 1,
            title: 'Happy Test',
            overview: 'A bright test result',
            vote_average: 8,
            vote_count: 20,
            popularity: 10,
          },
        ],
        page: 1,
        total_pages: 1,
        total_results: 1,
      });

      const params = { query: 'happy', type: 'movie' };
      const first = await search(params);
      const second = await search(params);

      expect(first.results).toHaveLength(1);
      expect(second).toBe(first);
      expect(tmdbGet).toHaveBeenCalledTimes(1);
      expect(canMakeRequest).toHaveBeenCalledTimes(1);
    });
  });
});
