import { useCallback, useMemo } from 'react';
import { getCachedTitleProviders } from '../services/providerService';
import { applySearchRanking } from '../utils/searchRanking';
import {
  buildTonightPicks,
  getRecommendationKey,
  rankRecommendations,
} from '../utils/recommendationScoring';

function genreLabelFor(item, genres) {
  const genreId = item.genre_ids?.[0];
  return genres.find(genre => genre.id === genreId)?.name || '';
}

function tieBreakers(a, b) {
  const aPopularity = a.popularity || 0;
  const bPopularity = b.popularity || 0;
  if (aPopularity !== bPopularity) return bPopularity - aPopularity;
  return (b.vote_count || 0) - (a.vote_count || 0);
}

/**
 * The Discover page's ranking pipeline, from raw results to the three Tonight
 * picks. Each stage narrows or reorders the one before it:
 *
 *   recommendations
 *     -> rating filter            (`filteredRecommendations`)
 *     -> search scope + ranking   (`scopedResults`)
 *     -> scored and sorted        (`rankedScorecards`)
 *     -> provider availability    (`filteredByServices`)
 *     -> three decision slots     (`tonightPicks`)
 *
 * Everything here is derived; the hook owns no state of its own.
 */
export function useHomeRanking({
  recommendations,
  searchResults,
  debouncedQuery,
  searchScope,
  minRating,
  selectedGenres,
  profile,
  showHidden,
  statusFor,
  contentType,
  region,
  genres,
  mood,
  watchlist,
  isWatched,
  watchHistory,
  watchlistGenreCounts,
  myServices,
  providerSnapshot,
  activeTonightMode,
  activeConstraintIds,
  tasteSettings,
  currentYear,
  lockedPickId,
  passedDecisionIds,
}) {
  const { liked: likedKeys = [], disliked: dislikedKeys = [] } = profile || {};

  const filteredRecommendations = useMemo(() => {
    if (minRating <= 0) return recommendations;
    return recommendations.filter(m => m.vote_average >= minRating);
  }, [recommendations, minRating]);

  const scopedResults = useMemo(() => {
    if (debouncedQuery && searchScope === 'within') {
      const filtered = filteredRecommendations.filter(item => {
        const title = (item.title || item.name || '').toLowerCase();
        return title.includes(debouncedQuery.toLowerCase());
      });
      return applySearchRanking(filtered, debouncedQuery, tieBreakers, selectedGenres, profile);
    }
    if (debouncedQuery && searchScope === 'all') {
      return applySearchRanking(
        searchResults,
        debouncedQuery,
        tieBreakers,
        selectedGenres,
        profile
      );
    }
    return filteredRecommendations;
  }, [
    filteredRecommendations,
    searchResults,
    debouncedQuery,
    searchScope,
    selectedGenres,
    profile,
  ]);

  const getProviderKey = useCallback(
    item => `${item.id}-${item.media_type || contentType}-${region}`,
    [contentType, region]
  );

  /** Providers for a title, preferring this session's snapshot over the cache. */
  const getProvidersFor = useCallback(
    (item, mediaType) =>
      providerSnapshot[getProviderKey(item)] || getCachedTitleProviders(item.id, mediaType, region),
    [getProviderKey, providerSnapshot, region]
  );

  const rankedScorecards = useMemo(() => {
    const visibleResults = showHidden
      ? scopedResults
      : scopedResults.filter(
          item => statusFor(item.id, item.media_type || contentType) !== 'disliked'
        );
    const savedKeys = watchlist.map(item => getRecommendationKey(item, item.media_type || 'movie'));
    const watchedKeys = watchlist
      .filter(item => isWatched(item.id, item.media_type || 'movie'))
      .map(item => getRecommendationKey(item, item.media_type || 'movie'));
    const watchHistoryKeys = watchHistory
      .slice(0, 30)
      .map(item => getRecommendationKey(item, item.media_type || 'movie'));
    const providerDataByKey = visibleResults.reduce((acc, item) => {
      const mediaType = item.media_type || contentType;
      acc[getRecommendationKey(item, mediaType)] = getProvidersFor(item, mediaType);
      return acc;
    }, {});

    return rankRecommendations(visibleResults, {
      mode: activeTonightMode,
      constraints: activeConstraintIds,
      selectedGenres,
      providerDataByKey,
      myServices,
      likedKeys,
      dislikedKeys,
      savedKeys,
      watchedKeys,
      watchHistoryKeys,
      watchlistGenreCounts,
      tasteSettings,
      contentType,
      currentYear,
    });
  }, [
    scopedResults,
    showHidden,
    statusFor,
    contentType,
    watchHistory,
    likedKeys,
    dislikedKeys,
    tasteSettings,
    watchlist,
    isWatched,
    watchlistGenreCounts,
    activeTonightMode,
    activeConstraintIds,
    selectedGenres,
    getProvidersFor,
    myServices,
    currentYear,
  ]);

  const tasteAdjustedResults = useMemo(
    () => rankedScorecards.map(scorecard => scorecard.item),
    [rankedScorecards]
  );

  const scorecardByKey = useMemo(
    () => new Map(rankedScorecards.map(scorecard => [scorecard.key, scorecard])),
    [rankedScorecards]
  );

  /**
   * The one-line "why this title" shown on a card. Prefers the scorecard's own
   * explanation, then falls back through taste, availability, mood, and history
   * signals so a card is never left without a reason.
   */
  const getRecommendationReason = useCallback(
    item => {
      const mediaType = item.media_type || contentType;
      const scorecard = scorecardByKey.get(getRecommendationKey(item, mediaType));
      if (scorecard?.explanation) return scorecard.explanation;

      const status = statusFor(item.id, mediaType);
      if (status === 'liked') return 'Because you liked this title';

      const cached = getProvidersFor(item, mediaType);
      if (
        myServices.length > 0 &&
        cached?.flatrate?.some(provider => myServices.includes(provider.id))
      ) {
        return 'Available on one of your services';
      }

      const genreLabel = genreLabelFor(item, genres);
      const matchingWatchlistGenres = (item.genre_ids || []).filter(
        genreId => watchlistGenreCounts[genreId] > 0
      );
      if (mood && genreLabel) return `Matches your ${mood} mood through ${genreLabel}`;
      if (matchingWatchlistGenres.length > 0 && genreLabel) {
        return `Boosted by your saved ${genreLabel} picks`;
      }
      if (watchHistory.some(historyItem => historyItem.media_type === mediaType)) {
        return `More ${mediaType === 'tv' ? 'series' : 'movies'} based on your history`;
      }
      if (item.vote_average >= 8) return 'Highly rated by TMDB viewers';
      return item.media_type === 'tv' ? 'Series pick for this vibe' : 'Movie pick for this vibe';
    },
    [
      contentType,
      scorecardByKey,
      statusFor,
      getProvidersFor,
      myServices,
      genres,
      mood,
      watchHistory,
      watchlistGenreCounts,
    ]
  );

  const filteredByServices = useMemo(() => {
    if (myServices.length === 0) return tasteAdjustedResults;
    return tasteAdjustedResults.filter(item => {
      const cached = getProvidersFor(item, item.media_type || contentType);
      // Missing provider data is not evidence of unavailability.
      if (!cached) return true;
      const ids = [
        ...cached.flatrate.map(p => p.id),
        ...cached.rent.map(p => p.id),
        ...cached.buy.map(p => p.id),
      ];
      return myServices.some(id => ids.includes(id));
    });
  }, [tasteAdjustedResults, myServices, getProvidersFor, contentType]);

  const tonightPicks = useMemo(() => {
    const visibleKeys = new Set(
      filteredByServices.map(item => getRecommendationKey(item, item.media_type || contentType))
    );
    const visibleScorecards = rankedScorecards.filter(scorecard => visibleKeys.has(scorecard.key));
    return buildTonightPicks(visibleScorecards, {
      lockedPickId,
      passedKeys: passedDecisionIds,
    });
  }, [contentType, filteredByServices, lockedPickId, passedDecisionIds, rankedScorecards]);

  return {
    filteredRecommendations,
    scopedResults,
    rankedScorecards,
    tasteAdjustedResults,
    scorecardByKey,
    getProviderKey,
    getRecommendationReason,
    filteredByServices,
    tonightPicks,
  };
}

export default useHomeRanking;
