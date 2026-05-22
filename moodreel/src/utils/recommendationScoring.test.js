import { describe, it, expect } from 'vitest';
import {
  scoreRecommendation,
  rankRecommendations,
  explainRecommendation,
} from './recommendationScoring';

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

  it('boosts titles that fit available time', () => {
    const short = { ...item, runtime: 95 };
    const out = scoreRecommendation(short, { availableMinutes: 120 });
    expect(out.reasons).toContain('Fits your available time');
  });

  it('ranks descending and returns explanation', () => {
    const ranked = rankRecommendations([item, { ...item, id: 2, vote_average: 5 }], {});
    expect(ranked[0].item.id).toBe(1);
    expect(explainRecommendation(item, {})).toContain('High audience rating');
  });
});
