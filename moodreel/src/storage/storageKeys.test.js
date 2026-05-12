import { describe, it, expect } from 'vitest';
import { StorageKeys, STORAGE_SCHEMA_VERSION } from './storageKeys';

describe('storageKeys', () => {
  it('locks in schema version for migrations', () => {
    expect(STORAGE_SCHEMA_VERSION).toBe(2);
  });

  it('keeps canonical keys stable', () => {
    expect(StorageKeys.WATCHLIST).toBe('moodreel_watchlist');
    expect(StorageKeys.TMDB_API_KEY_USER).toBe('moodreel-tmdb-api-key');
    expect(StorageKeys.SEARCH_CACHE).toBe('moodreel-search-persistent-cache');
  });
});
