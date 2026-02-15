import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY = 'f2b1a353af51ccd27736c209f7ea0ca6';

function getApiKey() {
    if (API_KEY) return API_KEY;
    if (typeof window === 'undefined') return null;
    if (window.__MOODREEL_TMDB_API_KEY__) {
        return window.__MOODREEL_TMDB_API_KEY__;
    }
    if (window.localStorage) {
        return window.localStorage.getItem('moodreel-tmdb-api-key');
    }
    return null;
}

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
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Missing TMDB API key. Set REACT_APP_TMDB_API_KEY or localStorage moodreel-tmdb-api-key.');
    }

    const finalParams = { ...params, api_key: apiKey };
    const cacheKey = cache ? getCacheKey(path, finalParams) : null;

    if (cache && cacheKey) {
        const cached = getCached(cacheKey, ttlMs);
        if (cached) return cached;
    }

    try {
        const response = await axios.get(`${API_BASE_URL}${path}`, {
            params: finalParams,
            signal
        });

        if (cache && cacheKey) {
            setCached(cacheKey, response.data);
        }

        return response.data;
    } catch (err) {
        if (!axios.isCancel(err)) {
            const errorMsg = err.response?.data?.status_message || err.message;
            const fullUrl = err.config?.url ? `${err.config.url}` : API_BASE_URL + path;
            console.error(`TMDB API Error [${path}]: ${errorMsg}`, {
                status: err.response?.status,
                url: fullUrl,
                params: normalizeParams(finalParams),
                data: err.response?.data
            });
        }
        throw err;
    }
}

const apiClient = {
    tmdbGet,
    ensureArray,
    ensureNumber,
    ensureString
};

export default apiClient;
