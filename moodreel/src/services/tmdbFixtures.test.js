import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tmdbGet } from './apiClient';

describe('tmdbFixtures mock mode', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_MOCK_TMDB', 'true');
  });

  it('returns discover fixture without network', async () => {
    const data = await tmdbGet('/discover/movie');
    expect(data.results?.length).toBeGreaterThan(0);
    expect(data.results[0].title).toBeTruthy();
  });
});
