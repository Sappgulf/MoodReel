const fixtures = {
  movie_us_netflix: {
    link: 'https://www.themoviedb.org/movie/550/watch',
    flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.jpg' }],
    rent: [],
    buy: [],
  },
};

const SAMPLE_MOVIE = {
  id: 550,
  title: 'Fight Club',
  overview: 'An insomniac office worker forms an underground fight club.',
  poster_path: '/pB8BM7pd15Nphd2ayfCwg6WRhcs.jpg',
  backdrop_path: '/fCayJkcjMmKP59NWg7wpL5tjtne.jpg',
  vote_average: 8.4,
  popularity: 120,
  release_date: '1999-10-15',
  genre_ids: [18],
  media_type: 'movie',
};

const SAMPLE_TV = {
  id: 1399,
  name: 'Game of Thrones',
  overview: 'Nine noble families fight for control over Westeros.',
  poster_path: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
  vote_average: 8.4,
  popularity: 200,
  first_air_date: '2011-04-17',
  genre_ids: [18],
  media_type: 'tv',
};

function detailsPayload(item, mediaType) {
  return {
    ...item,
    genres: [{ id: 18, name: 'Drama' }],
    similar: { results: [item] },
    videos: { results: [] },
    credits: { cast: [], crew: [] },
    'watch/providers': { results: { US: fixtures.movie_us_netflix } },
    media_type: mediaType,
  };
}

export async function installTmdbMocks(page) {
  await page.route('**/api.themoviedb.org/**', async route => {
    const url = route.request().url();

    if (url.includes('/search/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ page: 1, total_pages: 1, results: [SAMPLE_MOVIE, SAMPLE_TV] }),
      });
    }

    if (url.includes('/trending/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ page: 1, results: [SAMPLE_MOVIE, SAMPLE_TV] }),
      });
    }

    if (url.includes('/discover/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ page: 1, total_pages: 1, results: [SAMPLE_MOVIE, SAMPLE_TV] }),
      });
    }

    if (/\/movie\/\d+/.test(url) && !url.includes('/watch/providers')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detailsPayload(SAMPLE_MOVIE, 'movie')),
      });
    }

    if (/\/tv\/\d+/.test(url) && !url.includes('/watch/providers')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detailsPayload(SAMPLE_TV, 'tv')),
      });
    }

    if (url.includes('/watch/providers')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: {
            US: fixtures.movie_us_netflix,
          },
        }),
      });
    }

    if (url.includes('/genre/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ genres: [{ id: 18, name: 'Drama' }] }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [] }),
    });
  });
}

export async function prepareAppStorage(page) {
  await page.addInitScript(() => {
    localStorage.setItem('moodreel-onboarded', 'true');
    localStorage.setItem('moodreel-tmdb-api-key', 'e2e-test-key');
    window.__MOODREEL_TMDB_API_KEY__ = 'e2e-test-key';
  });
}
