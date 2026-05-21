import { describe, expect, it } from 'vitest';

import {
  buildProviderSections,
  computeTonightVerdict,
  computeWhyYouMightLikeIt,
  formatStarRating,
  getPersonInitials,
} from './movieDetailsUtils';

describe('movieDetailsUtils', () => {
  it('formats star ratings from TMDB score', () => {
    expect(formatStarRating(8)).toBe('★★★★☆');
  });

  it('builds provider sections from TMDB payload', () => {
    const sections = buildProviderSections({
      flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png' }],
      rent: [],
      buy: [],
    });

    expect(sections).toHaveLength(1);
    expect(sections[0].providers[0].name).toBe('Netflix');
  });

  it('computes tonight verdict with service and runtime signals', () => {
    const verdict = computeTonightVerdict({
      content: { id: 1, vote_average: 8, runtime: 100 },
      providerSections: [
        {
          key: 'stream',
          providers: [{ id: 8, name: 'Netflix', logoPath: '/n.png' }],
        },
      ],
      myServices: [8],
      mediaType: 'movie',
      isInWatchlist: () => false,
      isWatched: () => false,
    });

    expect(verdict.score).toBeGreaterThanOrEqual(70);
    expect(verdict.reasons[0]).toContain('Netflix');
  });

  it('derives why-you-might-like-it reasons from taste state', () => {
    const reasons = computeWhyYouMightLikeIt({
      content: { id: 2, vote_average: 6 },
      director: null,
      isLimitedDetails: false,
      mediaType: 'movie',
      statusFor: () => 'liked',
      watchHistory: [],
    });

    expect(reasons[0]).toContain('liked title');
  });

  it('creates person initials', () => {
    expect(getPersonInitials('Jane Doe')).toBe('JD');
  });
});
