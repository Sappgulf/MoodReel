import {
  buildTonightPicks,
  getRecommendationKey,
  rankRecommendations,
  scoreRecommendation,
  TONIGHT_MODES,
} from './recommendationScoring';

const mode = TONIGHT_MODES[0];

const makeItem = overrides => ({
  id: overrides.id,
  media_type: overrides.media_type || 'movie',
  title: overrides.title || `Movie ${overrides.id}`,
  overview: overrides.overview || '',
  genre_ids: overrides.genre_ids || [35],
  vote_average: overrides.vote_average ?? 7,
  vote_count: overrides.vote_count ?? 800,
  popularity: overrides.popularity ?? 40,
  release_date: overrides.release_date || '2022-01-01',
  runtime: overrides.runtime,
});

describe('recommendationScoring', () => {
  it('uses media type in recommendation keys', () => {
    expect(getRecommendationKey(makeItem({ id: 10, media_type: 'movie' }))).toBe('10-movie');
    expect(getRecommendationKey(makeItem({ id: 10, media_type: 'tv' }))).toBe('10-tv');
  });

  it('prefers provider, mood, and constraint matches over popularity alone', () => {
    const availableShortComedy = makeItem({
      id: 1,
      title: 'Cozy Laugh',
      genre_ids: [35],
      runtime: 84,
      popularity: 35,
    });
    const popularMismatch = makeItem({
      id: 2,
      title: 'Huge Horror',
      genre_ids: [27],
      runtime: 132,
      popularity: 400,
      vote_average: 6.4,
    });

    const ranked = rankRecommendations([popularMismatch, availableShortComedy], {
      mode,
      constraints: ['under-90', 'streaming-now', 'no-horror'],
      myServices: [8],
      providerData: { flatrate: [{ id: 8 }], rent: [], buy: [] },
      currentYear: 2026,
    });

    expect(ranked[0].item.title).toBe('Cozy Laugh');
    expect(ranked[0].reasons).toContain('available on your services');
    expect(ranked[1].penalties).toContain('horror filtered down');
  });

  it('penalizes already-watched titles enough to rank them below fresh picks', () => {
    const watched = makeItem({ id: 1, title: 'Watched Favorite', vote_average: 9 });
    const fresh = makeItem({ id: 2, title: 'Fresh Good Pick', vote_average: 7.2 });

    const ranked = rankRecommendations([watched, fresh], {
      mode,
      watchedKeys: ['1-movie'],
    });

    expect(ranked[0].item.title).toBe('Fresh Good Pick');
    expect(ranked[1].penalties).toContain('already watched');
  });

  it('creates safe, best, and wild tonight picks with explanations', () => {
    const scorecards = rankRecommendations(
      [
        makeItem({ id: 1, title: 'Safe Comedy', vote_count: 5000, popularity: 110 }),
        makeItem({ id: 2, title: 'Best Match', vote_average: 8.4, overview: 'warm cozy family' }),
        makeItem({ id: 3, title: 'Odd Gem', genre_ids: [878], popularity: 22 }),
      ],
      { mode, constraints: ['wild-card', 'high-rating'] }
    );

    const picks = buildTonightPicks(scorecards);

    expect(picks.map(pick => pick.slotLabel)).toEqual(['Safe Bet', 'Best Match', 'Wild Card']);
    expect(picks.every(pick => pick.explanation.includes(pick.slotLabel))).toBe(true);
    expect(picks.every(pick => Number.isFinite(pick.confidence))).toBe(true);
    expect(picks.every(pick => pick.debateLine.includes(pick.item.title))).toBe(true);
  });

  it('returns human-readable explanation text for a scorecard', () => {
    const scorecard = scoreRecommendation(makeItem({ id: 1, title: 'Cozy Laugh', runtime: 88 }), {
      mode,
      constraints: ['under-90'],
    });

    expect(scorecard.explanation).toMatch(/Cozy Laugh ranks here because/);
    expect(scorecard.reasons).toContain('under 90 minutes');
  });

  it('uses explicit taste settings without overriding hard constraints', () => {
    const shortMovie = makeItem({
      id: 1,
      title: 'Short Movie',
      media_type: 'movie',
      runtime: 82,
      genre_ids: [35],
    });
    const longHorror = makeItem({
      id: 2,
      title: 'Long Horror',
      media_type: 'movie',
      runtime: 148,
      genre_ids: [27],
      vote_average: 8.8,
    });

    const ranked = rankRecommendations([longHorror, shortMovie], {
      mode,
      constraints: ['no-horror'],
      tasteSettings: {
        contentType: 'movie',
        maxRuntime: 95,
        avoidHorror: true,
        hiddenGemBias: false,
        preferredDecades: [],
      },
    });

    expect(ranked[0].item.title).toBe('Short Movie');
    expect(ranked[0].reasons).toContain('within your runtime comfort zone');
    expect(ranked[1].penalties).toContain('against your no-horror preference');
  });
});
