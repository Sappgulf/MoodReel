const netflix = {
  provider_id: 8,
  provider_name: 'Netflix',
  logo_path: '/netflix.png',
  display_priority: 0,
};

const movieResults = [
  {
    id: 101,
    media_type: 'movie',
    title: 'Cozy Signal',
    overview: 'A warm group comedy about friends finding the perfect low-stakes night.',
    poster_path: '/cozy-signal.jpg',
    backdrop_path: '/cozy-signal-backdrop.jpg',
    release_date: '2024-02-02',
    genre_ids: [35, 10751],
    vote_average: 7.8,
    vote_count: 2200,
    popularity: 145,
    runtime: 96,
  },
  {
    id: 102,
    media_type: 'movie',
    title: 'Gold Room Mystery',
    overview: 'A stylish mystery with enough crowd energy to keep everyone guessing.',
    poster_path: '/gold-room.jpg',
    backdrop_path: '/gold-room-backdrop.jpg',
    release_date: '2023-10-13',
    genre_ids: [9648, 53],
    vote_average: 7.4,
    vote_count: 880,
    popularity: 72,
    runtime: 112,
  },
  {
    id: 103,
    media_type: 'movie',
    title: 'Left Turn Cinema',
    overview: 'A strange, funny science fiction detour for adventurous movie night.',
    poster_path: '/left-turn.jpg',
    backdrop_path: '/left-turn-backdrop.jpg',
    release_date: '2022-06-17',
    genre_ids: [878, 35],
    vote_average: 7.1,
    vote_count: 540,
    popularity: 34,
    runtime: 105,
  },
];

const tvResults = [
  {
    id: 201,
    media_type: 'tv',
    name: 'Friday Friends',
    overview: 'A quick, funny hangout series built around group decisions and shared jokes.',
    poster_path: '/friday-friends.jpg',
    backdrop_path: '/friday-friends-backdrop.jpg',
    first_air_date: '2025-01-09',
    genre_ids: [35],
    vote_average: 7.6,
    vote_count: 610,
    popularity: 64,
    episode_run_time: [42],
  },
];

const byKey = new Map(
  [...movieResults, ...tvResults].map(item => [`${item.media_type}:${item.id}`, item])
);

function paginated(results) {
  return {
    page: 1,
    total_pages: 1,
    total_results: results.length,
    results,
  };
}

function providers() {
  return {
    results: {
      US: {
        link: 'https://example.com/watch',
        flatrate: [netflix],
        rent: [],
        buy: [],
      },
    },
  };
}

function detailsFor(mediaType, id) {
  const item = byKey.get(`${mediaType}:${Number(id)}`);
  return {
    ...item,
    runtime: item?.runtime,
    episode_run_time: item?.episode_run_time,
    videos: {
      results: [
        {
          id: `${mediaType}-${id}-trailer`,
          key: `trailer-${id}`,
          name: `${item?.title || item?.name} Trailer`,
          site: 'YouTube',
          type: 'Trailer',
          official: true,
        },
      ],
    },
    credits: {
      cast: [
        {
          id: 9001,
          name: 'Avery Stone',
          character: 'Lead',
          profile_path: '/avery-stone.jpg',
        },
        {
          id: 9002,
          name: 'Mara Chen',
          character: 'Scene Partner',
          profile_path: '/mara-chen.jpg',
        },
      ],
    },
    similar: { results: [] },
    'watch/providers': providers(),
  };
}

export async function installTonightTmdbMocks(page) {
  await page.route('https://api.themoviedb.org/3/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/3', '');

    if (path === '/genre/movie/list' || path === '/genre/tv/list') {
      await route.fulfill({
        json: {
          genres: [
            { id: 35, name: 'Comedy' },
            { id: 10751, name: 'Family' },
            { id: 9648, name: 'Mystery' },
            { id: 53, name: 'Thriller' },
            { id: 878, name: 'Science Fiction' },
          ],
        },
      });
      return;
    }

    if (path === '/discover/movie') {
      await route.fulfill({ json: paginated(movieResults) });
      return;
    }

    if (path === '/discover/tv') {
      await route.fulfill({ json: paginated(tvResults) });
      return;
    }

    if (path === '/search/movie') {
      await route.fulfill({ json: paginated(movieResults) });
      return;
    }

    if (path === '/search/tv') {
      await route.fulfill({ json: paginated(tvResults) });
      return;
    }

    if (path === '/trending/all/day') {
      await route.fulfill({ json: paginated([...movieResults, ...tvResults]) });
      return;
    }

    const providerMatch = path.match(/^\/(movie|tv)\/(\d+)\/watch\/providers$/);
    if (providerMatch) {
      await route.fulfill({ json: providers() });
      return;
    }

    const detailsMatch = path.match(/^\/(movie|tv)\/(\d+)$/);
    if (detailsMatch) {
      await route.fulfill({ json: detailsFor(detailsMatch[1], detailsMatch[2]) });
      return;
    }

    await route.fulfill({ json: paginated([]) });
  });
}
