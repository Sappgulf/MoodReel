import { describe, it, expect } from 'vitest';
import {
  scoreRecommendation,
  rankRecommendations,
  explainRecommendation,
} from './recommendationScoring';

describe('time-fit scoring', () => {
  it('boosts titles that fit available minutes', () => {
    const short = scoreRecommendation(
      { id: 1, media_type: 'movie', vote_average: 7, popularity: 10, runtime: 95 },
      { availableMinutes: 120 }
    );
    const long = scoreRecommendation(
      { id: 2, media_type: 'movie', vote_average: 7, popularity: 10, runtime: 180 },
      { availableMinutes: 120 }
    );
    expect(short.score).toBeGreaterThan(long.score);
    expect(short.reasons.some(r => r.includes('time'))).toBe(true);
  });
});

describe('recommendationScoring', () => {
  const item = { id: 1, media_type: 'movie', vote_average: 8, popularity: 120, genre_ids: [35] };

  it('applies mood/provider/rating boosts', () => {
    const out = scoreRecommendation(item, {
      selectedGenres: [35],
      providerMatches: new Set(['movie:1']),
    });
    expect(out.score).toBeGreaterThan(90);
    expect(out.reasons).toContain('Matches your current mood');
  });

  it('penalizes watched/disliked', () => {
    const out = scoreRecommendation(item, {
      watchedKeys: new Set(['movie:1']),
      dislikedKeys: new Set(['movie:1']),
    });
    expect(out.score).toBeLessThan(30);
  });

  it('ranks descending and returns explanation', () => {
    const ranked = rankRecommendations([item, { ...item, id: 2, vote_average: 5 }], {});
    expect(ranked[0].item.id).toBe(1);
    expect(explainRecommendation(item, {})).toContain('High audience rating');
  });
});
