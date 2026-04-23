import { useState, useCallback, useRef, useEffect } from 'react';
import searchService from '../services/searchService';
import { getUserFacingMessage, shouldSkipLog } from '../services/apiErrorUtils';

export function useMovieDiscovery(currentYear, region = 'US', initialProviders = []) {
  const [mood, setMood] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [error, setError] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState(initialProviders);
  const [isLoading, setIsLoading] = useState(false);
  const [contentType, setContentType] = useState('all');
  const [matchType, setMatchType] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    yearMin: 1900,
    yearMax: currentYear,
    runtime: 'any',
    sortBy: 'popularity.desc',
  });

  const abortControllerRef = useRef(null);
  const loadMoreControllerRef = useRef(null);
  const loadMoreInFlightRef = useRef(false);

  const resetAdvancedFilters = useCallback(() => {
    setAdvancedFilters({
      yearMin: 1900,
      yearMax: currentYear,
      runtime: 'any',
      sortBy: 'popularity.desc',
    });
  }, [currentYear]);

  const resetAllFilters = useCallback(() => {
    setMood('');
    setSelectedGenres([]);
    setSelectedProviders([]);
    setMinRating(0);
    setMatchType('all');
    setContentType('all');
    setHasSearched(false);
    setRecommendations([]);
    setHasMore(false);
    setPage(1);
    resetAdvancedFilters();
  }, [resetAdvancedFilters]);

  const fetchTrending = useCallback(async signal => {
    try {
      const results = await searchService.fetchTrending('all', 'day', signal);
      setTrending(results);
    } catch (err) {
      if (!shouldSkipLog(err)) {
        console.error('Error fetching trending:', err);
      }
    }
  }, []);

  const search = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (loadMoreControllerRef.current) {
      loadMoreControllerRef.current.abort();
    }
    loadMoreInFlightRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError('');
    setIsLoading(true);
    setPage(1);
    setHasSearched(true);

    try {
      const result = await searchService.search(
        {
          query: mood,
          type: contentType,
          genres: selectedGenres,
          providers: selectedProviders,
          minRating,
          matchType,
          region,
          ...advancedFilters,
          page: 1,
          multiPage: true,
        },
        controller.signal
      );

      if (result.error) {
        setError(result.error);
      }

      if (result.results && result.results.length > 0) {
        setRecommendations(result.results);
        setHasMore(result.hasMore);
        setPage(result.page || 1);
      } else if (result.error) {
        setRecommendations([]);
        setHasMore(false);
      }
    } catch (err) {
      if (!shouldSkipLog(err)) {
        console.error('Error searching titles:', err);
        setError(getUserFacingMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    mood,
    contentType,
    selectedGenres,
    selectedProviders,
    minRating,
    matchType,
    advancedFilters,
    region,
  ]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadMoreInFlightRef.current) return;

    const controller = new AbortController();
    loadMoreControllerRef.current = controller;
    loadMoreInFlightRef.current = true;
    setIsLoading(true);
    const nextPage = page + 1;

    try {
      const result = await searchService.search(
        {
          query: mood,
          type: contentType,
          genres: selectedGenres,
          providers: selectedProviders,
          minRating,
          matchType,
          region,
          ...advancedFilters,
          page: nextPage,
        },
        controller.signal
      );

      if (result.results.length > 0) {
        setRecommendations(prev => {
          const existingIds = new Set(prev.map(p => `${p.id}-${p.media_type}`));
          const unique = result.results.filter(
            item => !existingIds.has(`${item.id}-${item.media_type}`)
          );
          return [...prev, ...unique];
        });
        setPage(result.page);
        setHasMore(result.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      if (!shouldSkipLog(err)) {
        // eslint-disable-next-line no-console
        console.error('Error loading more:', err);
      }
    } finally {
      setIsLoading(false);
      loadMoreInFlightRef.current = false;
    }
  }, [
    hasMore,
    page,
    mood,
    contentType,
    selectedGenres,
    selectedProviders,
    minRating,
    matchType,
    advancedFilters,
    region,
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (loadMoreControllerRef.current) {
        loadMoreControllerRef.current.abort();
      }
    };
  }, []);

  return {
    mood,
    setMood,
    recommendations,
    setRecommendations,
    trending,
    setTrending,
    error,
    setError,
    selectedGenres,
    setSelectedGenres,
    selectedProviders,
    setSelectedProviders,
    isLoading,
    setIsLoading,
    contentType,
    setContentType,
    matchType,
    setMatchType,
    page,
    setPage,
    hasMore,
    setHasMore,
    minRating,
    setMinRating,
    hasSearched,
    setHasSearched,
    advancedFilters,
    setAdvancedFilters,
    resetAdvancedFilters,
    resetAllFilters,
    fetchTrending,
    search,
    loadMore,
  };
}

export default useMovieDiscovery;
