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
import { canMakeRequest, getRemainingRequests } from '../utils/rateLimiter';
import { parseMoodToGenres } from '../utils/moodParser';

// TMDB API key
const API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'f2b1a353af51ccd27736c209f7ea0ca6';
const BASE_URL = 'https://api.themoviedb.org/3';

// Cache settings
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const searchCache = new Map();
const inflightRequests = new Map();

/**
 * Generate stable cache key from search params
 */
export function generateCacheKey(params) {
    const normalized = {
        query: (params.query || '').toLowerCase().trim(),
        type: params.type || 'all',
        page: params.page || 1,
        genres: [...(params.genres || [])].sort(),
        providers: [...(params.providers || [])].sort(),
        minRating: params.minRating || 0,
        yearMin: params.yearMin || 1900,
        yearMax: params.yearMax || new Date().getFullYear(),
        sortBy: params.sortBy || 'popularity.desc',
    };
    return JSON.stringify(normalized);
}

/**
 * Get cached result if valid
 */
function getCached(key) {
    const cached = searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
    }
    searchCache.delete(key);
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
}

/**
 * Build TMDB API URL for discover/search
 */
function buildApiUrl(params, mediaType) {
    const { query, page = 1, genres = [], providers = [], minRating = 0,
        yearMin = 1900, yearMax = new Date().getFullYear(), sortBy = 'popularity.desc' } = params;

    // Parse mood query to genres
    const moodGenres = parseMoodToGenres(query);
    const allGenres = [...new Set([...genres, ...moodGenres])];

    // If we have genres, use discover. Otherwise use search.
    if (allGenres.length > 0 || !query) {
        let url = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&page=${page}&sort_by=${sortBy}&include_adult=false`;

        // Always require minimum votes for quality results (except for newest releases)
        if (sortBy === 'vote_average.desc') {
            // Hidden gems: higher threshold to avoid obscure titles
            url += '&vote_count.gte=300';
        } else if (sortBy === 'revenue.desc') {
            url += '&vote_count.gte=100';
        } else if (sortBy !== 'primary_release_date.desc') {
            // Default: require at least 50 votes for reliability
            url += '&vote_count.gte=50';
        }

        if (allGenres.length > 0) {
            // Use comma for AND logic - results must match ALL selected genres
            url += `&with_genres=${allGenres.join(',')}`;

            // Exclude kids content when mature genres are selected
            const matureGenres = [27, 53, 80, 9648]; // Horror, Thriller, Crime, Mystery
            const kidsGenres = [10751, 16]; // Family, Animation
            const hasMatureGenre = allGenres.some(g => matureGenres.includes(g));
            const hasKidsGenre = allGenres.some(g => kidsGenres.includes(g));

            if (hasMatureGenre && !hasKidsGenre) {
                url += `&without_genres=${kidsGenres.join(',')}`;
            }
        }

        if (providers.length > 0) {
            url += `&with_watch_providers=${providers.join('|')}&watch_region=US`;
        }

        if (minRating > 0) {
            url += `&vote_average.gte=${minRating}`;
        }

        // Year filters
        const dateField = mediaType === 'tv' ? 'first_air_date' : 'primary_release_date';
        if (yearMin > 1900) {
            url += `&${dateField}.gte=${yearMin}-01-01`;
        }
        if (yearMax < new Date().getFullYear()) {
            url += `&${dateField}.lte=${yearMax}-12-31`;
        }

        return url;
    } else {
        // Text search - still apply include_adult filter
        return `${BASE_URL}/search/${mediaType}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
    }
}

/**
 * Fetch results for a single media type
 */
async function fetchMediaType(params, mediaType, signal) {
    const url = buildApiUrl(params, mediaType);
    const response = await axios.get(url, { signal });

    // Add media_type to each result
    const results = (response.data.results || []).map(item => ({
        ...item,
        media_type: mediaType
    }));

    // Apply client-side rating filter as backup
    const filtered = params.minRating > 0
        ? results.filter(m => m.vote_average >= params.minRating)
        : results;

    return {
        results: filtered,
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
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
 * @param {string} params.sortBy - Sort order
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
                const [movieData, tvData] = await Promise.all([
                    fetchMediaType(params, 'movie', signal),
                    fetchMediaType(params, 'tv', signal)
                ]);

                // Interleave results (alternating movie/tv for variety)
                const maxLen = Math.max(movieData.results.length, tvData.results.length);
                for (let i = 0; i < maxLen; i++) {
                    if (movieData.results[i]) results.push(movieData.results[i]);
                    if (tvData.results[i]) results.push(tvData.results[i]);
                }

                page = Math.min(movieData.page, tvData.page);
                totalPages = Math.max(movieData.totalPages, tvData.totalPages);
            } else {
                const data = await fetchMediaType(params, type, signal);
                results = data.results;
                page = data.page;
                totalPages = data.totalPages;
            }

            const result = {
                results,
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

            // Return error state
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
 * Clear all cached search results
 */
export function clearCache() {
    searchCache.clear();
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
    getCacheStats
};

export default searchService;
