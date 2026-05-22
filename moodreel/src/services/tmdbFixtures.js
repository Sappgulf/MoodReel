import discoverMovie from '../test/fixtures/tmdb/discover-movie.json';
import trending from '../test/fixtures/tmdb/trending.json';
import watchProvidersCatalog from '../test/fixtures/tmdb/watch-providers-catalog.json';
import movieWatchProviders from '../test/fixtures/tmdb/movie-watch-providers.json';

function matchPath(path) {
  if (path === '/trending/all/day' || path.startsWith('/trending/')) return 'trending';
  if (path === '/discover/movie' || path === '/discover/tv') return 'discover';
  if (path.startsWith('/watch/providers/')) return 'catalog';
  if (/\/(movie|tv)\/\d+\/watch\/providers$/.test(path)) return 'titleProviders';
  if (/\/(movie|tv)\/\d+$/.test(path)) return 'details';
  if (path.startsWith('/search/')) return 'discover';
  return 'discover';
}

export function getTmdbFixture(path) {
  const kind = matchPath(path);
  switch (kind) {
    case 'trending':
      return trending;
    case 'catalog':
      return watchProvidersCatalog;
    case 'titleProviders':
      return movieWatchProviders;
    case 'details':
      return {
        id: 550,
        media_type: 'movie',
        title: 'Fight Club',
        overview: 'Mock details',
        poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrDu3JIy.jpg',
        vote_average: 8.4,
        genre_ids: [18],
        runtime: 139,
      };
    case 'discover':
    default:
      return discoverMovie;
  }
}
