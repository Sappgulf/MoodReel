import {
  buildScoreBreakdown,
  buildTonightPicks,
  explainRecommendation,
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

  it('gives the highest-ranked title to Best Match, not to Safe Bet', () => {
    const scorecards = rankRecommendations(
      [
        makeItem({ id: 1, title: 'Runner Up', vote_average: 7.2, vote_count: 4000 }),
        makeItem({ id: 2, title: 'Top Ranked', vote_average: 8.6, vote_count: 6000 }),
        makeItem({ id: 3, title: 'Third Place', vote_average: 6.9, vote_count: 900 }),
      ],
      { mode }
    );

    const picks = buildTonightPicks(scorecards);
    const bestMatch = picks.find(pick => pick.slot === 'best');

    expect(bestMatch.key).toBe(scorecards[0].key);
  });

  it('honours a locked pick as Best Match and never repeats it in another slot', () => {
    const scorecards = rankRecommendations(
      [
        makeItem({ id: 1, title: 'Top Ranked', vote_average: 8.6, vote_count: 6000 }),
        makeItem({ id: 2, title: 'Locked Choice', vote_average: 7.0, vote_count: 900 }),
        makeItem({ id: 3, title: 'Spare', vote_average: 6.9, vote_count: 800 }),
      ],
      { mode }
    );
    const lockedKey = scorecards.find(card => card.item.title === 'Locked Choice').key;

    const picks = buildTonightPicks(scorecards, { lockedPickId: lockedKey });

    expect(picks.find(pick => pick.slot === 'best').key).toBe(lockedKey);
    expect(picks.filter(pick => pick.key === lockedKey)).toHaveLength(1);
  });

  it('breaks near-ties in favour of a pick that differs from the ones already made', () => {
    // Built directly so the three candidates differ only in genre overlap:
    // "Repeat" shares both of Best Match's genres, "Distinct" shares one.
    const card = (id, title, genre_ids, confidence) => ({
      key: `${id}-movie`,
      item: makeItem({ id, title, genre_ids }),
      confidence,
      score: confidence,
      reasons: [],
      penalties: [],
    });
    const scorecards = [
      card(1, 'Top Pick', [35, 80], 96),
      card(2, 'Repeat', [35, 80], 95),
      card(3, 'Distinct', [35, 53], 94),
    ];

    const picks = buildTonightPicks(scorecards);

    expect(picks.find(pick => pick.slot === 'best').item.title).toBe('Top Pick');
    expect(picks.find(pick => pick.slot === 'safe').item.title).toBe('Distinct');
  });

  it('never puts two titles from the same franchise in the picks', () => {
    const sequelOf = collectionId => ({ belongs_to_collection: { id: collectionId } });
    const scorecards = rankRecommendations(
      [
        { ...makeItem({ id: 1, title: 'Saga I', vote_average: 8.5 }), ...sequelOf(77) },
        { ...makeItem({ id: 2, title: 'Saga II', vote_average: 8.4 }), ...sequelOf(77) },
        { ...makeItem({ id: 3, title: 'Saga III', vote_average: 8.3 }), ...sequelOf(77) },
        makeItem({ id: 4, title: 'Standalone', genre_ids: [18], vote_average: 7.0 }),
      ],
      { mode }
    );

    const picks = buildTonightPicks(scorecards);
    const sagaPicks = picks.filter(pick => pick.item.belongs_to_collection?.id === 77);

    expect(sagaPicks.length).toBeLessThanOrEqual(1);
  });

  it('skips passed titles when rebuilding the picks', () => {
    const scorecards = rankRecommendations(
      [
        makeItem({ id: 1, title: 'Passed On', vote_average: 8.6, vote_count: 6000 }),
        makeItem({ id: 2, title: 'Next Up', vote_average: 8.0, vote_count: 3000 }),
        makeItem({ id: 3, title: 'Also Fine', vote_average: 7.4, vote_count: 1200 }),
      ],
      { mode }
    );
    const passedKey = scorecards.find(card => card.item.title === 'Passed On').key;

    const picks = buildTonightPicks(scorecards, { passedKeys: [passedKey] });

    expect(picks.some(pick => pick.key === passedKey)).toBe(false);
  });

  it('returns human-readable explanation text for a scorecard', () => {
    const scorecard = scoreRecommendation(makeItem({ id: 1, title: 'Cozy Laugh', runtime: 88 }), {
      mode,
      constraints: ['under-90'],
    });

    expect(scorecard.explanation).toMatch(/Cozy Laugh ranks here because/);
    expect(explainRecommendation(scorecard, { slotLabel: 'Safe Bet' })).toMatch(
      /Safe Bet: Cozy Laugh ranks here/
    );
    expect(scorecard.reasons).toContain('under 90 minutes');
  });

  it('builds visible score breakdown rows from scorecard signals', () => {
    const rows = buildScoreBreakdown({
      item: makeItem({
        id: 44,
        title: 'Transparent Pick',
        vote_average: 8.1,
        vote_count: 900,
      }),
      confidence: 91,
      availabilityState: 'available',
      reasons: ['matches the requested vibe', 'available on your services'],
      penalties: [],
    });

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Mood match', value: 'Strong' }),
        expect.objectContaining({ label: 'Availability', value: 'On your services' }),
        expect.objectContaining({ label: 'Decision score', value: '91%' }),
      ])
    );
  });

  it('filters unavailable provider matches when services-only is active', () => {
    const available = makeItem({ id: 1, title: 'On Netflix' });
    const unavailable = makeItem({ id: 2, title: 'Not Included' });

    const ranked = rankRecommendations([available, unavailable], {
      mode,
      myServices: [8],
      servicesOnly: true,
      providerDataByKey: {
        '1-movie': { flatrate: [{ id: 8 }], rent: [], buy: [] },
        '2-movie': { flatrate: [{ id: 9 }], rent: [], buy: [] },
      },
    });

    expect(ranked.map(scorecard => scorecard.item.title)).toEqual(['On Netflix']);
    expect(ranked[0].reasons).toContain('available on your services');
  });

  it('uses available time to prefer runtime fits', () => {
    const short = makeItem({ id: 1, title: 'Tight 88', runtime: 88, vote_average: 7.1 });
    const long = makeItem({ id: 2, title: 'Three Hour Epic', runtime: 181, vote_average: 8.9 });

    const ranked = rankRecommendations([long, short], {
      mode,
      maxRuntime: 100,
      riskPreference: 'safe',
    });

    expect(ranked[0].item.title).toBe('Tight 88');
    expect(ranked[0].reasons).toContain('fits the time available');
    expect(ranked[1].penalties).toContain('too long for tonight');
  });

  it('differentiates safe and adventurous preferences deterministically', () => {
    const crowdSafe = makeItem({
      id: 1,
      title: 'Crowd Safe',
      genre_ids: [35],
      vote_average: 7.5,
      vote_count: 8000,
      popularity: 260,
    });
    const strangeGem = makeItem({
      id: 2,
      title: 'Strange Gem',
      genre_ids: [878],
      vote_average: 7.1,
      vote_count: 500,
      popularity: 35,
    });

    const safeRanked = rankRecommendations([strangeGem, crowdSafe], {
      mode,
      riskPreference: 'safe',
    });
    const wildRanked = rankRecommendations([crowdSafe, strangeGem], {
      mode,
      riskPreference: 'adventurous',
    });

    expect(safeRanked[0].item.title).toBe('Crowd Safe');
    expect(wildRanked[0].item.title).toBe('Strange Gem');
    expect(wildRanked[0].reasons).toContain('adventurous pick profile');
  });

  it('can hide disliked and watched titles from the ranked pool', () => {
    const disliked = makeItem({ id: 1, title: 'Nope' });
    const watched = makeItem({ id: 2, title: 'Seen It' });
    const fresh = makeItem({ id: 3, title: 'Fresh' });

    const ranked = rankRecommendations([disliked, watched, fresh], {
      mode,
      dislikedKeys: ['1-movie'],
      watchedKeys: ['2-movie'],
      hideDisliked: true,
      hideWatched: true,
    });

    expect(ranked.map(scorecard => scorecard.item.title)).toEqual(['Fresh']);
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

  it('keeps provider availability ahead of a better-rated unavailable title in services-only mode', () => {
    const available = makeItem({
      id: 1,
      title: 'Actually Streamable',
      vote_average: 7.1,
      vote_count: 400,
      genre_ids: [35],
    });
    const unavailable = makeItem({
      id: 2,
      title: 'Better But Elsewhere',
      vote_average: 9.1,
      vote_count: 12000,
      popularity: 500,
      genre_ids: [35],
    });

    const ranked = rankRecommendations([unavailable, available], {
      mode,
      servicesOnly: true,
      myServices: [8],
      providerDataByKey: {
        '1-movie': { flatrate: [{ id: 8 }], rent: [], buy: [] },
        '2-movie': { flatrate: [{ id: 9 }], rent: [], buy: [] },
      },
    });

    expect(ranked).toHaveLength(1);
    expect(ranked[0].item.title).toBe('Actually Streamable');
  });

  it('respects family context by downranking horror even when ratings are strong', () => {
    const horror = makeItem({
      id: 1,
      title: 'Award Horror',
      genre_ids: [27],
      vote_average: 9.2,
      vote_count: 20000,
      popularity: 900,
    });
    const family = makeItem({
      id: 2,
      title: 'Family Adventure',
      genre_ids: [10751, 12],
      vote_average: 7.1,
      vote_count: 500,
    });

    const ranked = rankRecommendations([horror, family], {
      mode,
      watchingContext: 'family',
    });

    expect(ranked[0].item.title).toBe('Family Adventure');
    expect(ranked[1].penalties).toContain('rough fit for family viewing');
  });
});
