import { applySearchRanking } from './searchRanking';

const sample = [
  { id: 1, title: 'The Batman', popularity: 10 },
  { id: 2, title: 'Batman Begins', popularity: 40 },
  { id: 3, title: 'Batgirl', popularity: 60 },
  { id: 4, title: 'Random Movie', popularity: 99 },
];

describe('searchRanking', () => {
  it('prioritizes exact and prefix matches before loose matches', () => {
    const ranked = applySearchRanking(sample, 'batman');
    expect(ranked[0].title).toBe('Batman Begins');
    expect(ranked[1].title).toBe('The Batman');
    // Note: "The Batman" (score 2) comes after "Batman Begins" (score 1)
    // because "Batman Begins" starts with "batman " (prefix match).
  });

  it('returns source list when query is empty', () => {
    expect(applySearchRanking(sample, '')).toBe(sample);
  });

  it('uses tie breaker when rank score is equal', () => {
    const ranked = applySearchRanking(
      [
        { id: 1, title: 'Spider Man', popularity: 10 },
        { id: 2, title: 'Spider Woman', popularity: 20 },
      ],
      'spider',
      (a, b) => b.popularity - a.popularity
    );

    expect(ranked[0].title).toBe('Spider Woman');
  });

  it('uses taste profile to promote liked titles and de-prioritize disliked titles', () => {
    const tasteSample = [
      { id: 1, title: 'night watch', media_type: 'movie', popularity: 10 },
      { id: 2, title: 'night shift', media_type: 'movie', popularity: 10 },
      { id: 3, title: 'night owl', media_type: 'movie', popularity: 10 },
    ];
    const ranked = applySearchRanking(tasteSample, 'night', null, [], {
      liked: ['2-movie'],
      disliked: ['3-movie'],
    });

    expect(ranked.map(item => item.id)).toEqual([2, 1, 3]);
  });
});
