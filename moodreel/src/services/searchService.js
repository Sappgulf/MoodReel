/**
 * SearchService - Unified search with caching, debounce, and abort handling
 *
 * Features:
 * - Query normalization
 * - Cache by (query + type + filters + page) with 5min TTL
 * - Inflight request deduplication
 * - AbortController for request cancellation
 * - Unified Movies + TV search
 */

import { parseMoodToGenres } from '../utils/moodParser';
import { canMakeRequest, getRemainingRequests } from '../utils/rateLimiter';
import { tmdbGet, ensureArray, ensureNumber } from './apiClient';
import { getDisplayTitle, getDisplayOverview, getReleaseYear } from '../utils/mediaUtils';
import { applySearchRanking } from '../utils/searchRanking';
import { getUserFacingMessage, isAbortError, shouldSkipLog } from './apiErrorUtils';

// Cache settings
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour (matched Home.js)
const CONTENT_DETAILS_TTL_MS = 30 * 60 * 1000; // 30 minutes
const ACTOR_CREDITS_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_KEY = 'moodreel-search-persistent-cache';
const MAX_CACHE_ENTRIES = 50;
const SEARCH_FALLBACK_EVENT = 'moodreel:search-fallback';
const HAS_LOCAL_STORAGE =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// Initialize cache from localStorage
const searchCache = new Map();
function pruneSearchCache() {
  const now = Date.now();
  let changed = false;

  // Drop stale items first.
  for (const [key, value] of searchCache.entries()) {
    if (!value?.timestamp || now - value.timestamp >= CACHE_TTL_MS) {
      searchCache.delete(key);
      changed = true;
    }
  }

  // Enforce max cache size by preserving newest entries.
  if (searchCache.size > MAX_CACHE_ENTRIES) {
    const ordered = [...searchCache.entries()].sort(
      (a, b) => ensureNumber(b[1]?.timestamp, 0) - ensureNumber(a[1]?.timestamp, 0)
    );
    searchCache.clear();
    ordered.slice(0, MAX_CACHE_ENTRIES).forEach(([key, value]) => {
      searchCache.set(key, value);
    });
    changed = true;
  }

  return changed;
}

function persistSearchCache() {
  if (!HAS_LOCAL_STORAGE) return;

  try {
    pruneSearchCache();
    const obj = Object.fromEntries(searchCache);
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {
    // Ignore localStorage failures in restricted environments.
  }
}

function hydrateSearchCache() {
  if (!HAS_LOCAL_STORAGE) return;

  try {
    const saved = window.localStorage.getItem(CACHE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);
    Object.entries(parsed).forEach(([key, value]) => {
      searchCache.set(key, value);
    });

    const changed = pruneSearchCache();
    if (changed) {
      persistSearchCache();
    }
  } catch (err) {
    console.warn('Failed to load search cache from localStorage', err);
    try {
      window.localStorage.removeItem(CACHE_KEY);
    } catch {
      // Ignore cleanup failures.
    }
  }
}

hydrateSearchCache();

const inflightRequests = new Map();
const contentDetailsCache = new Map();
const actorCreditsCache = new Map();
const contentDetailsInflight = new Map();
const actorCreditsInflight = new Map();

function normalizeMediaItem(item, mediaType) {
  const title = getDisplayTitle(item);
  return {
    ...item,
    media_type: mediaType,
    title,
    name: item.name || item.title || title,
    overview: getDisplayOverview(item),
    release_year: getReleaseYear(item),
  };
}

function dedupeByMediaId(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = `${item.media_type}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getTieBreakers(a, b) {
  const aPopularity = ensureNumber(a.popularity, 0);
  const bPopularity = ensureNumber(b.popularity, 0);
  if (aPopularity !== bPopularity) return bPopularity - aPopularity;

  const aVotes = ensureNumber(a.vote_count, 0);
  const bVotes = ensureNumber(b.vote_count, 0);
  return bVotes - aVotes;
}

/**
 * Generate stable cache key from search params
 */
export function generateCacheKey(params) {
  const normalized = {
    query: (params.query || '').toLowerCase().trim(),
    type: params.type || 'all',
    page: params.page || 1,
    genres: [...(params.genres || [])].sort(),
    matchType: params.matchType || 'all', // Include in cache key used
    providers: [...(params.providers || [])].sort(),
    minRating: params.minRating || 0,
    yearMin: params.yearMin || 1900,
    yearMax: params.yearMax || new Date().getFullYear(),
    sortBy: params.sortBy || 'popularity.desc',
    runtime: params.runtime || 'any',
    region: params.region || 'US',
  };
  return JSON.stringify(normalized);
}

/**
 * Get cached result if valid
 * @param {string} key - Cache key
 * @param {boolean} ignoreTTL - If true, returns cached data even if expired
 */
function getCached(key, ignoreTTL = false) {
  const cached = searchCache.get(key);
  if (!cached) return null;

  if (ignoreTTL || Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Only delete if we are strictly checking TTL
  if (!ignoreTTL) {
    searchCache.delete(key);
    persistSearchCache();
  }
  return null;
}

function getCachedWithTtl(cache, key, ttlMs, ignoreTTL = false) {
  const cached = cache.get(key);
  if (!cached) return null;

  if (ignoreTTL || Date.now() - cached.timestamp < ttlMs) {
    return cached.data;
  }

  if (!ignoreTTL) {
    cache.delete(key);
  }
  return null;
}

function setCachedWithTtl(cache, key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

function emitSearchFallback(detail) {
  if (typeof window === 'undefined' || !window.dispatchEvent) return;

  try {
    const event = new CustomEvent(SEARCH_FALLBACK_EVENT, { detail });
    window.dispatchEvent(event);
  } catch {
    // Ignore telemetry dispatch failures for robust offline behavior.
  }
}

function getSearchErrorMessage(err) {
  return getUserFacingMessage(err);
}

function isUnreachableTmdbError(err) {
  return shouldSkipLog(err);
}

/**
 * Set cache entry
 */
function setCache(key, data) {
  searchCache.set(key, { data, timestamp: Date.now() });
  pruneSearchCache();
  persistSearchCache();
}

/**
 * Build TMDB API URL for discover/search
 */
function buildApiRequest(params, mediaType) {
  const {
    query,
    page = 1,
    genres = [],
    providers = [],
    minRating = 0,
    yearMin = 1900,
    yearMax = new Date().getFullYear(),
    sortBy = 'popularity.desc',
    matchType = 'all', // 'all' (AND) or 'any' (OR)
    runtime = 'any',
    region = 'US',
  } = params;

  // Parse mood query to genres
  const moodGenres = parseMoodToGenres(query);
  const allGenres = [...new Set([...genres, ...moodGenres])];

  // If we have genres, use discover. Otherwise use search.
  if (allGenres.length > 0 || !query) {
    const params = {
      page,
      sort_by: sortBy,
      include_adult: false,
      watch_region: region,
    };

    // Always require minimum votes for quality results (except for newest releases)
    if (sortBy === 'vote_average.desc') {
      // Hidden gems: higher threshold to avoid obscure titles
      params['vote_count.gte'] = 500; // Increased from 300 for higher quality
    } else if (sortBy === 'revenue.desc') {
      params['vote_count.gte'] = 200; // Increased from 100
    } else if (sortBy !== 'primary_release_date.desc') {
      // Default: require at least 100 votes for reliability
      params['vote_count.gte'] = 100; // Increased from 50
    }

    if (allGenres.length > 0) {
      // Delimiter: comma (,) for AND, pipe (|) for OR
      const delimiter = matchType === 'any' ? '|' : ',';
      params.with_genres = allGenres.join(delimiter);

      // Exclude kids content when mature genres are selected AND matchType is ALL
      if (matchType === 'all') {
        const matureGenres = [27, 53, 80, 9648]; // Horror, Thriller, Crime, Mystery
        const kidsGenres = [10751, 16]; // Family, Animation
        const hasMatureGenre = allGenres.some(g => matureGenres.includes(g));
        const hasKidsGenre = allGenres.some(g => kidsGenres.includes(g));

        if (hasMatureGenre && !hasKidsGenre) {
          params.without_genres = kidsGenres.join(',');
        }
      }
    }

    if (providers.length > 0) {
      params.with_watch_providers = providers.join('|');
      params.watch_region = region;
    }

    if (minRating > 0) {
      params['vote_average.gte'] = minRating;
    }

    // Year filters
    const dateField = mediaType === 'tv' ? 'first_air_date' : 'primary_release_date';
    if (yearMin > 1900) {
      params[`${dateField}.gte`] = `${yearMin}-01-01`;
    }
    if (yearMax < new Date().getFullYear()) {
      params[`${dateField}.lte`] = `${yearMax}-12-31`;
    }

    // Runtime filter (movie-only: TV runtimes are inconsistent in list responses)
    if (mediaType === 'movie' && runtime && runtime !== 'any') {
      if (runtime === 'short') {
        params['with_runtime.lte'] = 90;
      } else if (runtime === 'medium') {
        params['with_runtime.gte'] = 90;
        params['with_runtime.lte'] = 150;
      } else if (runtime === 'long') {
        params['with_runtime.gte'] = 150;
      }
    }

    return { path: `/discover/${mediaType}`, params };
  } else {
    // Text search
    return {
      path: `/search/${mediaType}`,
      params: {
        query,
        page,
        include_adult: false,
      },
    };
  }
}

/**
 * Fetch results for a single media type
 */
async function fetchMediaType(params, mediaType, signal) {
  const request = buildApiRequest(params, mediaType);
  const response = await tmdbGet(request.path, { params: request.params, signal });

  const results = ensureArray(response.results).map(item => normalizeMediaItem(item, mediaType));

  // Apply client-side rating filter as backup
  const filtered =
    params.minRating > 0 ? results.filter(m => m.vote_average >= params.minRating) : results;

  return {
    results: filtered,
    page: ensureNumber(response.page, 1),
    totalPages: ensureNumber(response.total_pages, 0),
    totalResults: ensureNumber(response.total_results, 0),
  };
}

/**
 * Main search function
 */
export async function search(params, signal) {
  const normalizedQuery = (params.query || '').trim();

  // Validate: need at least a query or genre selection
  if (!normalizedQuery && (!params.genres || params.genres.length === 0)) {
    return {
      results: [],
      page: 1,
      totalPages: 0,
      hasMore: false,
      error: 'Please enter a mood or select a genre.',
    };
  }

  // Check rate limit
  if (!canMakeRequest()) {
    return {
      results: [],
      page: 1,
      totalPages: 0,
      hasMore: false,
      error: `Rate limit reached. Please wait a moment. (${getRemainingRequests()} remaining)`,
    };
  }

  const cacheKey = generateCacheKey(params);

  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  // Check for inflight request with same key
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      const type = params.type || 'all';
      let results = [];
      let page = params.page || 1;
      let totalPages = 0;

      if (type === 'all') {
        // Fetch both movies and TV in parallel
        const fetchPromises = [
          fetchMediaType(params, 'movie', signal),
          fetchMediaType(params, 'tv', signal),
        ];

        // For initial page 1, fetch page 2 too for more results if requested
        if (params.multiPage && (params.page === 1 || !params.page)) {
          fetchPromises.push(
            fetchMediaType({ ...params, page: 2 }, 'movie', signal).catch(() => ({ results: [] })),
            fetchMediaType({ ...params, page: 2 }, 'tv', signal).catch(() => ({ results: [] }))
          );
        }

        const dataResults = await Promise.all(fetchPromises);
        const movie1 = dataResults[0];
        const tv1 = dataResults[1];
        const movie2 = dataResults[2] || { results: [] };
        const tv2 = dataResults[3] || { results: [] };

        const movies = [...movie1.results, ...movie2.results];
        const tvs = [...tv1.results, ...tv2.results];

        // Interleave results intelligently based on popularity
        const allResults = [];
        const maxLen = Math.max(movies.length, tvs.length);
        for (let i = 0; i < maxLen; i++) {
          if (movies[i]) allResults.push(movies[i]);
          if (tvs[i]) allResults.push(tvs[i]);
        }
        results = allResults;

        page = params.multiPage ? 2 : params.page || 1;
        totalPages = Math.max(movie1.totalPages, tv1.totalPages);
      } else {
        const data1 = await fetchMediaType(params, type, signal);
        results = [...data1.results];
        page = data1.page;
        totalPages = data1.totalPages;

        if (params.multiPage && (params.page === 1 || !params.page)) {
          try {
            const data2 = await fetchMediaType({ ...params, page: 2 }, type, signal);
            results = [...results, ...data2.results];
            page = 2;
          } catch (e) {
            // Ignore page 2 failure
          }
        }
      }

      const dedupedResults = dedupeByMediaId(results);
      const rankedResults = applySearchRanking(dedupedResults, normalizedQuery, getTieBreakers);

      const result = {
        results: rankedResults,
        page,
        totalPages,
        hasMore: page < totalPages,
      };

      // Smart Fallback: If no results for specific mood/genre, try basic trending
      if (result.results.length === 0 && (normalizedQuery || params.genres?.length > 0)) {
        try {
          const trendingResults = await fetchTrending('all', 'day', signal);
          result.results = trendingResults;
          result.isFallback = true;
          result.error =
            "We couldn't find exact matches for that mood, but here's what's trending!";
          emitSearchFallback({
            type: 'search-no-match-fallback',
            query: normalizedQuery,
            requestedType: type,
            resultsReturned: trendingResults.length,
          });
        } catch (e) {
          // Ignore fallback failure
        }
      }

      // Cache successful results
      setCache(cacheKey, result);

      return result;
    } catch (err) {
      if (isAbortError(err)) {
        throw err;
      }
      const errorMessage = getSearchErrorMessage(err);
      if (isUnreachableTmdbError(err)) {
        emitSearchFallback({
          type: 'search-service-unavailable',
          query: normalizedQuery,
          requestedType: params.type || 'all',
          reason: 'tmdb_unreachable',
        });
        return {
          results: [],
          page: 1,
          totalPages: 0,
          hasMore: false,
          error: 'TMDB data is temporarily unavailable.',
        };
      }

      const staleData = getCached(cacheKey, true);
      if (staleData) {
        console.debug('Returning stale cache data due to network error');
        emitSearchFallback({
          type: 'search-stale-cache',
          query: normalizedQuery,
          requestedType: params.type || 'all',
          resultsReturned: staleData.results?.length || 0,
        });
        return {
          ...staleData,
          isStale: true,
          error: 'Showing offline results',
        };
      }

      return {
        results: [],
        page: 1,
        totalPages: 0,
        hasMore: false,
        error: errorMessage,
      };
    } finally {
      inflightRequests.delete(cacheKey);
    }
  })();

  inflightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Fetch genres list for movies or TV
 */
export async function fetchGenres(type = 'movie', signal) {
  const response = await tmdbGet(`/genre/${type}/list`, {
    signal,
    cache: true,
    ttlMs: 24 * 60 * 60 * 1000,
  });
  return ensureArray(response.genres);
}

/**
 * Fetch a random discovery result (True Random)
 */
export async function fetchRandomDiscovery(signal) {
  const type = Math.random() > 0.5 ? 'movie' : 'tv';
  const page = Math.floor(Math.random() * 20) + 1;

  const response = await tmdbGet(`/discover/${type}`, {
    signal,
    params: {
      language: 'en-US',
      sort_by: 'popularity.desc',
      include_adult: false,
      'vote_count.gte': 100,
      'vote_average.gte': 6.0,
      page,
    },
  });
  const results = ensureArray(response.results);
  if (results.length === 0) return null;

  const randomItem = results[Math.floor(Math.random() * results.length)];
  return normalizeMediaItem(randomItem, type);
}

/**
 * Fetch trending content
 */
export async function fetchTrending(type = 'all', timeWindow = 'day', signal) {
  const response = await tmdbGet(`/trending/${type}/${timeWindow}`, {
    signal,
    cache: true,
    ttlMs: 10 * 60 * 1000,
  });
  return ensureArray(response.results)
    .slice(0, 8)
    .map(item => normalizeMediaItem(item, item.media_type || (type === 'all' ? 'movie' : type)));
}

/**
 * Fetch all details for a movie or TV show in parallel
 */
export async function fetchContentDetails(id, mediaType = 'movie', signal) {
  const cacheKey = `${mediaType}:${id}`;
  const cached = getCachedWithTtl(contentDetailsCache, cacheKey, CONTENT_DETAILS_TTL_MS);
  if (cached) {
    return cached;
  }

  if (contentDetailsInflight.has(cacheKey)) {
    return contentDetailsInflight.get(cacheKey);
  }

  const requestPromise = (async () => {
    try {
      const data = await tmdbGet(`/${mediaType}/${id}`, {
        signal,
        params: { append_to_response: 'similar,videos,credits,watch/providers' },
      });

      const result = {
        details: normalizeMediaItem(data, mediaType),
        similar: ensureArray(data.similar?.results).map(item =>
          normalizeMediaItem(item, mediaType)
        ),
        providers: data['watch/providers']?.results || null,
        videos: ensureArray(data.videos?.results),
        credits: data.credits || { cast: [] },
      };

      setCachedWithTtl(contentDetailsCache, cacheKey, result);
      return result;
    } catch (err) {
      if (isAbortError(err)) {
        throw err;
      }

      const stale = getCachedWithTtl(contentDetailsCache, cacheKey, CONTENT_DETAILS_TTL_MS, true);
      if (stale) {
        if (!shouldSkipLog(err)) {
          console.debug('Returning stale content details due to network error');
        }
        return stale;
      }

      throw err;
    } finally {
      contentDetailsInflight.delete(cacheKey);
    }
  })();

  contentDetailsInflight.set(cacheKey, requestPromise);
  return requestPromise;
}

export async function fetchSimilar(id, mediaType = 'movie', signal) {
  const response = await tmdbGet(`/${mediaType}/${id}/similar`, { signal });
  return ensureArray(response.results).map(item => normalizeMediaItem(item, mediaType));
}

export async function fetchActorCredits(actorId, signal) {
  const cacheKey = `${actorId}`;
  const cached = getCachedWithTtl(actorCreditsCache, cacheKey, ACTOR_CREDITS_TTL_MS);
  if (cached) {
    return cached;
  }

  if (actorCreditsInflight.has(cacheKey)) {
    return actorCreditsInflight.get(cacheKey);
  }

  const requestPromise = (async () => {
    try {
      const response = await tmdbGet(`/person/${actorId}/combined_credits`, { signal });
      const credits = ensureArray(response.cast);
      setCachedWithTtl(actorCreditsCache, cacheKey, credits);
      return credits;
    } catch (err) {
      if (isAbortError(err)) {
        throw err;
      }

      const stale = getCachedWithTtl(actorCreditsCache, cacheKey, ACTOR_CREDITS_TTL_MS, true);
      if (stale) {
        if (!shouldSkipLog(err)) {
          console.debug('Returning stale actor credits due to network error');
        }
        return stale;
      }

      throw err;
    } finally {
      actorCreditsInflight.delete(cacheKey);
    }
  })();

  actorCreditsInflight.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Clear all cached search results
 */
export function clearCache() {
  searchCache.clear();
  contentDetailsCache.clear();
  actorCreditsCache.clear();
  if (HAS_LOCAL_STORAGE) {
    window.localStorage.removeItem(CACHE_KEY);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: searchCache.size,
    inflight: inflightRequests.size,
    contentDetailsCacheSize: contentDetailsCache.size,
    actorCreditsCacheSize: actorCreditsCache.size,
    contentDetailsInflight: contentDetailsInflight.size,
    actorCreditsInflight: actorCreditsInflight.size,
  };
}

const searchService = {
  search,
  generateCacheKey,
  clearCache,
  getCacheStats,
  fetchGenres,
  fetchTrending,
  fetchContentDetails,
  fetchSimilar,
  fetchRandomDiscovery,
  fetchActorCredits,
};

export default searchService;
