import { describe, it, expect } from 'vitest';
import { buildDiscoveryParams, describeActiveFilters } from './searchContext';

describe('searchContext', () => {
  it('buildDiscoveryParams merges advanced filters', () => {
    const params = buildDiscoveryParams({
      mood: 'cozy',
      contentType: 'movie',
      selectedGenres: [35],
      matchType: 'any',
      advancedFilters: { yearMin: 2000, sortBy: 'vote_average.desc' },
    });
    expect(params.query).toBe('cozy');
    expect(params.type).toBe('movie');
    expect(params.genres).toEqual([35]);
    expect(params.matchType).toBe('any');
    expect(params.yearMin).toBe(2000);
  });

  it('describeActiveFilters explains AND vs OR genres', () => {
    const andResult = describeActiveFilters({
      mood: 'happy',
      selectedGenres: [35, 18],
      matchType: 'all',
    });
    expect(andResult.chips.some(c => c.key === 'genres')).toBe(true);
    expect(andResult.logicHint).toMatch(/AND/i);

    const orResult = describeActiveFilters({
      selectedGenres: [35, 18],
      matchType: 'any',
    });
    expect(orResult.logicHint).toMatch(/OR/i);
  });
});
