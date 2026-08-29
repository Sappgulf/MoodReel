import { useCallback, useEffect, useRef, useState } from 'react';
import searchService from '../services/searchService';
import { getUserFacingMessage, isAbortError, shouldSkipLog } from '../services/apiErrorUtils';

const DEBOUNCE_MS = 400;

/**
 * Title search for the Discover page.
 *
 * Two scopes share one query box: `within` filters the mood results already on
 * screen (handled by the caller, since it needs no network), while `all`
 * searches the whole catalog — that request lives here.
 *
 * The query is debounced, in-flight requests are aborted when the query or
 * scope changes, and results are only ever populated for the `all` scope.
 */
export function useTitleSearch({ filters, tasteProfile }) {
  const [titleQuery, setTitleQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchScope, setSearchScope] = useState('within');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [isSearchingAll, setIsSearchingAll] = useState(false);
  // Bumped to re-run the search effect after a failure, without the caller
  // needing to reach into the request lifecycle itself.
  const [retryNonce, setRetryNonce] = useState(0);
  const searchControllerRef = useRef(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(titleQuery.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [titleQuery]);

  const { contentType, selectedProviders, minRating, matchType, region, advancedFilters } = filters;

  const performAllSearch = useCallback(
    async (query, controller) => {
      try {
        const result = await searchService.search(
          {
            query,
            type: contentType,
            genres: [],
            providers: selectedProviders,
            minRating,
            matchType,
            region,
            ...advancedFilters,
            page: 1,
            multiPage: true,
          },
          controller.signal,
          { tasteProfile }
        );

        if (result.error) {
          setSearchError(result.error);
        }
        setSearchResults(result.results || []);
      } catch (err) {
        if (!shouldSkipLog(err)) {
          console.error('Error performing title search:', err);
        }
        if (!isAbortError(err)) {
          setSearchError(getUserFacingMessage(err));
        }
      } finally {
        setIsSearchingAll(false);
      }
    },
    [contentType, selectedProviders, minRating, matchType, region, advancedFilters, tasteProfile]
  );

  const isAllScopeSearch = searchScope === 'all' && Boolean(debouncedQuery);

  useEffect(() => {
    if (!isAllScopeSearch) return undefined;

    if (searchControllerRef.current) {
      searchControllerRef.current.abort();
    }
    const controller = new AbortController();
    searchControllerRef.current = controller;
    // A network fetch, not derived state: the request's own status flags are
    // seeded here and the request is aborted on cleanup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSearchingAll(true);
    setSearchError('');

    performAllSearch(debouncedQuery, controller);

    return () => controller.abort();
  }, [debouncedQuery, isAllScopeSearch, performAllSearch, retryNonce]);

  const retryAllScopeSearch = useCallback(() => {
    setRetryNonce(nonce => nonce + 1);
  }, []);

  return {
    titleQuery,
    setTitleQuery,
    debouncedQuery,
    searchScope,
    setSearchScope,
    // Results only apply to the `all` scope; the `within` scope filters the
    // caller's existing list instead.
    searchResults: isAllScopeSearch ? searchResults : [],
    searchError: isAllScopeSearch ? searchError : '',
    isSearchingAll,
    retryAllScopeSearch,
  };
}

export default useTitleSearch;
