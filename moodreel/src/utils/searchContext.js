import { parseMoodToGenres } from './moodParser';
import { genreNames as GENRE_NAME_MAP } from './moodParser';

/**
 * Build TMDB search params from discovery UI state.
 */
export function buildDiscoveryParams({
  mood = '',
  contentType = 'all',
  selectedGenres = [],
  selectedProviders = [],
  minRating = 0,
  matchType = 'all',
  region = 'US',
  advancedFilters = {},
  page = 1,
  multiPage = false,
}) {
  return {
    query: mood,
    type: contentType,
    genres: selectedGenres,
    providers: selectedProviders,
    minRating,
    matchType,
    region,
    yearMin: advancedFilters.yearMin ?? 1900,
    yearMax: advancedFilters.yearMax ?? new Date().getFullYear(),
    runtime: advancedFilters.runtime ?? 'any',
    sortBy: advancedFilters.sortBy ?? 'popularity.desc',
    page,
    multiPage,
  };
}

function genreLabel(id) {
  return GENRE_NAME_MAP[id] || `Genre ${id}`;
}

/**
 * Human-readable explanation of how active filters combine.
 */
export function describeActiveFilters({
  mood = '',
  selectedGenres = [],
  selectedProviders = [],
  providerCatalog = [],
  minRating = 0,
  matchType = 'all',
  contentType = 'all',
  advancedFilters = {},
  myServices = [],
}) {
  const chips = [];
  const moodGenres = parseMoodToGenres(mood);
  const genreJoin = matchType === 'any' ? ' OR ' : ' + ';

  if (mood.trim()) {
    chips.push({ key: 'mood', label: `Mood: “${mood.trim()}”`, logic: 'text' });
  }

  if (moodGenres.length > 0) {
    const names = moodGenres.map(genreLabel);
    chips.push({
      key: 'mood-genres',
      label: `Mood genres: ${names.join(', ')}`,
      logic: 'merged',
    });
  }

  if (selectedGenres.length > 0) {
    const names = selectedGenres.map(genreLabel);
    chips.push({
      key: 'genres',
      label: `Categories (${matchType === 'any' ? 'any' : 'all'}): ${names.join(genreJoin)}`,
      logic: matchType === 'any' ? 'or' : 'and',
    });
  }

  const providerIds = selectedProviders.length > 0 ? selectedProviders : myServices;
  if (providerIds.length > 0) {
    const names = providerIds
      .map(id => providerCatalog.find(p => p.id === id)?.name || `Service ${id}`)
      .slice(0, 6);
    const suffix =
      providerIds.length > names.length ? ` +${providerIds.length - names.length}` : '';
    chips.push({
      key: 'providers',
      label: `Streaming (any): ${names.join(' OR ')}${suffix}`,
      logic: 'or',
    });
  }

  if (minRating > 0) {
    chips.push({ key: 'rating', label: `Rating ≥ ${minRating}`, logic: 'min' });
  }

  if (advancedFilters.yearMin > 1900 || advancedFilters.yearMax < new Date().getFullYear()) {
    chips.push({
      key: 'year',
      label: `Years ${advancedFilters.yearMin || 1900}–${advancedFilters.yearMax || new Date().getFullYear()}`,
      logic: 'range',
    });
  }

  if (advancedFilters.runtime && advancedFilters.runtime !== 'any') {
    chips.push({ key: 'runtime', label: `Runtime: ${advancedFilters.runtime}`, logic: 'filter' });
  }

  if (contentType !== 'all') {
    chips.push({
      key: 'type',
      label: contentType === 'movie' ? 'Movies only' : 'TV only',
      logic: 'type',
    });
  }

  const parts = [];
  if (chips.length === 0) {
    return {
      chips: [],
      summary: 'No filters — shuffle and search use broad popular picks.',
      logicHint:
        'Add a mood or categories to narrow results. Multiple categories use AND by default (all must match).',
    };
  }

  if (selectedGenres.length > 1) {
    parts.push(
      matchType === 'any'
        ? 'Categories match if any selected genre fits (OR).'
        : 'Categories must all match together (AND).'
    );
  }

  if (providerIds.length > 1) {
    parts.push('Titles can appear on any of your selected services (OR).');
  }

  if (moodGenres.length > 0 && selectedGenres.length > 0) {
    parts.push('Mood keywords and selected categories are combined.');
  }

  return {
    chips,
    summary: chips.map(c => c.label).join(' · '),
    logicHint: parts.join(' '),
  };
}

export function mediaKey(item) {
  if (!item) return '';
  return `${item.media_type || 'movie'}:${item.id}`;
}
