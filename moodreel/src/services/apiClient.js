import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

const memoryCache = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000;

function normalizeParams(params) {
    const entries = Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null);
    entries.sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries);
}

function getCacheKey(path, params) {
    return `${path}?${JSON.stringify(normalizeParams(params))}`;
}

function getCached(key, ttlMs) {
    const cached = memoryCache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > ttlMs) {
        memoryCache.delete(key);
        return null;
    }
    return cached.data;
}

function setCached(key, data) {
    memoryCache.set(key, { data, timestamp: Date.now() });
    if (memoryCache.size > 100) {
        const oldestKey = memoryCache.keys().next().value;
        memoryCache.delete(oldestKey);
    }
}

export function ensureString(value, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

export function ensureNumber(value, fallback = 0) {
    return Number.isFinite(value) ? value : fallback;
}

export function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}

export async function tmdbGet(path, { params = {}, signal, cache = false, ttlMs = DEFAULT_TTL_MS } = {}) {
    if (!API_KEY) {
        throw new Error('Missing TMDB API key. Set REACT_APP_TMDB_API_KEY in your environment.');
    }

    const finalParams = { ...params, api_key: API_KEY };
    const cacheKey = cache ? getCacheKey(path, finalParams) : null;

    if (cache && cacheKey) {
        const cached = getCached(cacheKey, ttlMs);
        if (cached) return cached;
    }

    const response = await axios.get(`${API_BASE_URL}${path}`, {
        params: finalParams,
        signal
    });

    if (cache && cacheKey) {
        setCached(cacheKey, response.data);
    }

    return response.data;
}

const apiClient = {
    tmdbGet,
    ensureArray,
    ensureNumber,
    ensureString
};

export default apiClient;
