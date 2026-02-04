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

import axios from 'axios';
import { parseMoodToGenres } from '../utils/moodParser';
import { canMakeRequest, getRemainingRequests } from '../utils/rateLimiter';
import { tmdbGet, ensureArray, ensureNumber } from './apiClient';
import { getDisplayTitle, getDisplayOverview, getReleaseYear } from '../utils/mediaUtils';
import { applySearchRanking } from '../utils/searchRanking';

// Cache settings
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour (matched Home.js)
const CACHE_KEY = 'moodreel-search-persistent-cache';

// Initialize cache from localStorage
const searchCache = new Map();
try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([key, value]) => {
            if (Date.now() - value.timestamp < CACHE_TTL_MS) {
                searchCache.set(key, value);
            }
        });
    }
} catch (e) {
    console.warn('Failed to load search cache from localStorage');
}

const inflightRequests = new Map();

function normalizeMediaItem(item, mediaType) {
    const title = getDisplayTitle(item);
    return {
        ...item,
        media_type: mediaType,
        title,
        name: item.name || item.title || title,
        overview: getDisplayOverview(item),
        release_year: getReleaseYear(item)
    };
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
        region: params.region || 'US'
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
    }
    return null;
}

/**
 * Set cache entry
 */
function setCache(key, data) {
    searchCache.set(key, { data, timestamp: Date.now() });

    // Limit cache size to prevent memory bloat (keep last 50 entries)
    if (searchCache.size > 50) {
        const oldestKey = searchCache.keys().next().value;
        searchCache.delete(oldestKey);
    }

    // Persist to localStorage
    try {
        const obj = Object.fromEntries(searchCache);
        localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch (e) {
        // Silently fail if quota exceeded
    }
}

/**
 * Build TMDB API URL for discover/search
 */
function buildApiRequest(params, mediaType) {
    const { query, page = 1, genres = [], providers = [], minRating = 0,
        yearMin = 1900, yearMax = new Date().getFullYear(), sortBy = 'popularity.desc',
        matchType = 'all', // 'all' (AND) or 'any' (OR)
        runtime = 'any',
        region = 'US'
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
            watch_region: region
        };

        // Always require minimum votes for quality results (except for newest releases)
        if (sortBy === 'vote_average.desc') {
            // Hidden gems: higher threshold to avoid obscure titles
            params['vote_count.gte'] = 300;
        } else if (sortBy === 'revenue.desc') {
            params['vote_count.gte'] = 100;
        } else if (sortBy !== 'primary_release_date.desc') {
            // Default: require at least 50 votes for reliability
            params['vote_count.gte'] = 50;
        }

        if (allGenres.length > 0) {
            // Delimiter: comma (,) for AND, pipe (|) for OR
            const delimiter = matchType === 'any' ? '|' : ',';
            params.with_genres = allGenres.join(delimiter);

            // Exclude kids content when mature genres are selected AND matchType is ALL
            // (If matchType is ANY, we might want family + action mixed, so skipping exclusion is safer)
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
        // Text search - still apply include_adult filter
        return {
            path: `/search/${mediaType}`,
            params: {
                query,
                page,
                include_adult: false
            }
        };
    }
}

/**
 * Fetch results for a single media type
 */
async function fetchMediaType(params, mediaType, signal) {
    const request = buildApiRequest(params, mediaType);
    const response = await tmdbGet(request.path, { params: request.params, signal });

    const results = ensureArray(response.results).map((item) => normalizeMediaItem(item, mediaType));

    // Apply client-side rating filter as backup
    const filtered = params.minRating > 0
        ? results.filter(m => m.vote_average >= params.minRating)
        : results;

    return {
        results: filtered,
        page: ensureNumber(response.page, 1),
        totalPages: ensureNumber(response.total_pages, 0),
        totalResults: ensureNumber(response.total_results, 0)
    };
}

/**
 * Main search function
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query (mood or title)
 * @param {string} params.type - 'movie' | 'tv' | 'all'
 * @param {number} params.page - Page number (1-indexed)
 * @param {number[]} params.genres - Genre IDs
 * @param {number[]} params.providers - Streaming provider IDs
 * @param {number} params.minRating - Minimum rating (0-10)
 * @param {number} params.yearMin - Minimum year
 * @param {number} params.yearMax - Maximum year
 * @param {string} params.runtime - Runtime bucket ('any' | 'short' | 'medium' | 'long')
 * @param {boolean} params.multiPage - Fetch two pages at once (default for page 1)
 * @param {AbortSignal} signal - AbortSignal for cancellation
 * 
 * @returns {Promise<{results: Array, page: number, totalPages: number, hasMore: boolean}>}
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
            error: 'Please enter a mood or select a genre.'
        };
    }

    // Check rate limit
    if (!canMakeRequest()) {
        return {
            results: [],
            page: 1,
            totalPages: 0,
            hasMore: false,
            error: `Rate limit reached. Please wait a moment. (${getRemainingRequests()} remaining)`
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
                    fetchMediaType(params, 'tv', signal)
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

                // Interleave results
                const maxLen = Math.max(movies.length, tvs.length);
                for (let i = 0; i < maxLen; i++) {
                    if (movies[i]) results.push(movies[i]);
                    if (tvs[i]) results.push(tvs[i]);
                }

                page = params.multiPage ? 2 : (params.page || 1);
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

            const rankedResults = applySearchRanking(results, normalizedQuery, getTieBreakers);

            const result = {
                results: rankedResults,
                page,
                totalPages,
                hasMore: page < totalPages
            };

            // Cache successful results
            setCache(cacheKey, result);

            return result;
        } catch (err) {
            if (axios.isCancel(err)) {
                throw err; // Rethrow cancellation
            }
            if (err.message && err.message.includes('Missing TMDB API key')) {
                return {
                    results: [],
                    page: 1,
                    totalPages: 0,
                    hasMore: false,
                    error: 'Missing TMDB API key. Please add REACT_APP_TMDB_API_KEY or set localStorage moodreel-tmdb-api-key.'
                };
            }

            // ATTEMPT TO RECOVER FROM STALE CACHE
            const staleData = getCached(cacheKey, true); // true = ignoreTTL
            if (staleData) {
                console.log('Returning stale cache data due to network error');
                return {
                    ...staleData,
                    isStale: true, // Marker for UI
                    error: 'Showing offline results'
                };
            }

            // Return error state if no cache
            return {
                results: [],
                page: 1,
                totalPages: 0,
                hasMore: false,
                error: 'Network error. Please check your connection.'
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
    const response = await tmdbGet(`/genre/${type}/list`, { signal, cache: true, ttlMs: 24 * 60 * 60 * 1000 });
    return ensureArray(response.genres);
}

/**
 * Fetch a random discovery result (True Random)
 */
export async function fetchRandomDiscovery(signal) {
    // Randomly choose Movie or TV
    const type = Math.random() > 0.5 ? 'movie' : 'tv';

    // Random page between 1 and 20 (Top 400 items)
    const page = Math.floor(Math.random() * 20) + 1;

    const response = await tmdbGet(`/discover/${type}`, {
        signal,
        params: {
            language: 'en-US',
            sort_by: 'popularity.desc',
            include_adult: false,
            include_video: false,
            'vote_count.gte': 100,
            'vote_average.gte': 6.0,
            page
        }
    });
    const results = ensureArray(response.results);

    if (results.length === 0) return null;

    // Pick a random item from the results
    const randomItem = results[Math.floor(Math.random() * results.length)];

    return {
        ...randomItem,
        media_type: type
    };
}

/**
 * Fetch trending content
 */
export async function fetchTrending(type = 'all', timeWindow = 'day', signal) {
    const response = await tmdbGet(`/trending/${type}/${timeWindow}`, { signal, cache: true, ttlMs: 10 * 60 * 1000 });
    return ensureArray(response.results).slice(0, 8);
}

/**
 * Fetch all details for a movie or TV show in parallel
 * Uses append_to_response to minimize API requests
 */
export async function fetchContentDetails(id, mediaType = 'movie', signal) {
    const data = await tmdbGet(`/${mediaType}/${id}`, {
        signal,
        params: { append_to_response: 'similar,videos,credits,watch/providers' }
    });

    return {
        details: normalizeMediaItem(data, mediaType),
        similar: ensureArray(data.similar?.results).map((item) => normalizeMediaItem(item, mediaType)),
        providers: data['watch/providers']?.results || null,
        videos: ensureArray(data.videos?.results),
        credits: data.credits || { cast: [] }
    };
}

export async function fetchSimilar(id, mediaType = 'movie', signal) {
    const response = await tmdbGet(`/${mediaType}/${id}/similar`, { signal });
    return ensureArray(response.results).map((item) => normalizeMediaItem(item, mediaType));
}

/**
 * Clear all cached search results
 */
export function clearCache() {
    searchCache.clear();
    localStorage.removeItem(CACHE_KEY);
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats() {
    return {
        size: searchCache.size,
        inflight: inflightRequests.size
    };
}

// Named export for ESLint compliance
const searchService = {
    search,
    generateCacheKey,
    clearCache,
    getCacheStats,
    fetchGenres,
    fetchTrending,
    fetchContentDetails,
    fetchSimilar,
    fetchRandomDiscovery
};

export default searchService;
