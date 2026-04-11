import axios from 'axios';
import { isAbortError, getUserFacingMessage, isExpectedTmdbErrorForLogging, shouldSkipLog } from './apiErrorUtils';

const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
const processEnv = typeof process !== 'undefined' ? process.env || {} : {};
const resolveEnv = (keys) => {
    for (const key of keys) {
        if (viteEnv[key] !== undefined) return viteEnv[key];
        if (processEnv[key] !== undefined) return processEnv[key];
    }
    return undefined;
};

const API_BASE_URL = resolveEnv(['VITE_TMDB_BASE_URL', 'REACT_APP_TMDB_BASE_URL']) || 'https://api.themoviedb.org/3';
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

function getApiKey() {
    const envApiKey = resolveEnv(['VITE_TMDB_API_KEY', 'REACT_APP_TMDB_API_KEY']);
    if (envApiKey) return envApiKey;

    if (typeof window === 'undefined') return null;
    if (window.__MOODREEL_TMDB_API_KEY__) {
        return window.__MOODREEL_TMDB_API_KEY__;
    }
    if (window.localStorage) {
        return window.localStorage.getItem('moodreel-tmdb-api-key');
    }
    return null;
}

export class TmdbApiError extends Error {
    constructor({ code, message, path, status = null, retryAfter = null, cause = null, retryable = false }) {
        super(message);
        this.name = 'TmdbApiError';
        this.code = code;
        this.path = path;
        this.status = status;
        this.retryAfter = retryAfter;
        this.isRetryable = retryable;
        if (cause) {
            this.cause = cause;
        }
    }
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(err) {
    if (err?.code === 'TMDB_REQUEST_CANCELLED') return false;
    if (err?.isRetryable !== undefined) return err.isRetryable;
    const status = err?.status || err?.response?.status;
    return !status || status >= 500 || status === 429;
}

function normalizeApiError(err, path) {
    if (err instanceof TmdbApiError) return err;
    if (isAbortError(err)) {
        return new TmdbApiError({
            code: 'TMDB_REQUEST_CANCELLED',
            message: 'Request was canceled.',
            path,
            retryable: false
        });
    }

    const status = err?.response?.status;
    const body = err?.response?.data || {};
    if (!status) {
        return new TmdbApiError({
            code: 'TMDB_NETWORK_ERROR',
            message: 'TMDB API unavailable.',
            path,
            status,
            isRetryable: true,
            cause: err
        });
    }

    const retryAfterHeader = err?.response?.headers?.['retry-after'];
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null;

    return new TmdbApiError({
        code: `TMDB_HTTP_${status}`,
        message: body?.status_message || toUserMessage({ code: `HTTP_${status}`, status }),
        path,
        status,
        retryAfter,
        retryable: status >= 500 || status === 429 || status === 408,
        cause: err
    });
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

export async function tmdbGet(path, { params = {}, signal, cache = false, ttlMs = DEFAULT_TTL_MS, retries = MAX_RETRIES } = {}) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new TmdbApiError({
            code: 'TMDB_API_KEY_MISSING',
            message: 'TMDB API unavailable. Configure your API key.',
            path,
            status: 401,
            retryable: false
        });
    }

    const finalParams = { ...params, api_key: apiKey };
    const cacheKey = cache ? getCacheKey(path, finalParams) : null;

    if (cache && cacheKey) {
        const cached = getCached(cacheKey, ttlMs);
        if (cached) return cached;
    }

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
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
            if (isAbortError(err)) {
                throw err;
            }

            const normalized = normalizeApiError(err, path);
            lastError = normalized;

            const errorMsg = normalized.message;
            const fullUrl = err?.config?.url ? `${err.config.url}` : API_BASE_URL + path;
            console.error(`TMDB API Error [${path}] (attempt ${attempt + 1}/${retries + 1}): ${errorMsg}`, {
                code: normalized.code,
                status: normalized.status,
                url: fullUrl,
                params: normalizeParams(finalParams),
                retryAfter: normalized.retryAfter
            });

            if (attempt < retries && isRetryableError(normalized)) {
                const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
                console.debug(`Retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            }
            throw normalized;
        }
    }
    throw lastError;
}

const apiClient = {
    tmdbGet,
    ensureArray,
    ensureNumber,
    ensureString,
    isAbortError,
    isExpectedTmdbErrorForLogging,
    shouldSkipLog
};

export default apiClient;
