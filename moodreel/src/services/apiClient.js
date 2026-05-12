import axios from 'axios';
import {
  isAbortError,
  getUserFacingMessage,
  isExpectedTmdbErrorForLogging,
  shouldSkipLog,
} from './apiErrorUtils';
import { StorageKeys as SK } from '../storage/storageKeys';
import { resolvePublicEnv } from '../utils/publicEnv';
import { safeGetRaw, safeSetRaw, safeRemove } from '../storage/safeStorage';

const API_BASE_URL =
  resolvePublicEnv(['VITE_TMDB_BASE_URL', 'REACT_APP_TMDB_BASE_URL']) ||
  'https://api.themoviedb.org/3';
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const API_KEY_SOURCE_USER = 'user';
const API_KEY_SOURCE_ENV = 'environment';
const API_KEY_SOURCE_BOOTSTRAP = 'bootstrap';
const API_KEY_SOURCE_MISSING = 'missing';

function resolveEnvApiKey() {
  return resolvePublicEnv(['VITE_TMDB_API_KEY', 'REACT_APP_TMDB_API_KEY']);
}

function resolveBootstrapApiKey() {
  if (typeof window === 'undefined') return null;
  return window.__MOODREEL_TMDB_API_KEY__ || null;
}

function resolveStoredApiKey() {
  return safeGetRaw(SK.TMDB_API_KEY_USER, null);
}

export function getApiKeyStatus() {
  const envApiKey = resolveEnvApiKey();
  if (envApiKey) {
    return {
      configured: true,
      source: API_KEY_SOURCE_ENV,
      value: envApiKey,
      hasKey: true,
    };
  }

  const bootstrapApiKey = resolveBootstrapApiKey();
  if (bootstrapApiKey) {
    return {
      configured: true,
      source: API_KEY_SOURCE_BOOTSTRAP,
      value: bootstrapApiKey,
      hasKey: true,
    };
  }

  const storedApiKey = resolveStoredApiKey();
  if (storedApiKey) {
    return {
      configured: true,
      source: API_KEY_SOURCE_USER,
      value: storedApiKey,
      hasKey: true,
    };
  }

  return {
    configured: false,
    source: API_KEY_SOURCE_MISSING,
    value: null,
    hasKey: false,
  };
}

export function saveUserApiKey(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    safeRemove(SK.TMDB_API_KEY_USER);
    return false;
  }
  return safeSetRaw(SK.TMDB_API_KEY_USER, trimmed);
}

export function clearUserApiKey() {
  safeRemove(SK.TMDB_API_KEY_USER);
}

function getApiKey() {
  return getApiKeyStatus().value;
}

export class TmdbApiError extends Error {
  constructor({
    code,
    message,
    path,
    status = null,
    retryAfter = null,
    cause = null,
    retryable = false,
  }) {
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
  const entries = Object.entries(params || {}).filter(
    ([, value]) => value !== undefined && value !== null
  );
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
      retryable: false,
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
      cause: err,
    });
  }

  const retryAfterHeader = err?.response?.headers?.['retry-after'];
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null;

  return new TmdbApiError({
    code: `TMDB_HTTP_${status}`,
    message: body?.status_message || getUserFacingMessage({ code: `TMDB_HTTP_${status}`, status }),
    path,
    status,
    retryAfter,
    retryable: status >= 500 || status === 429 || status === 408,
    cause: err,
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

export async function tmdbGet(
  path,
  { params = {}, signal, cache = false, ttlMs = DEFAULT_TTL_MS, retries = MAX_RETRIES } = {}
) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new TmdbApiError({
      code: 'TMDB_API_KEY_MISSING',
      message: 'TMDB API unavailable. Configure your API key.',
      path,
      status: 401,
      retryable: false,
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
        signal,
        timeout: DEFAULT_REQUEST_TIMEOUT_MS,
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
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev && !shouldSkipLog(normalized)) {
        console.error(
          `TMDB API Error [${path}] (attempt ${attempt + 1}/${retries + 1}): ${errorMsg}`,
          {
            code: normalized.code,
            status: normalized.status,
            url: fullUrl,
            params: normalizeParams(finalParams),
            retryAfter: normalized.retryAfter,
          }
        );
      }

      if (attempt < retries && isRetryableError(normalized)) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        if (isDev) {
          console.debug(`Retrying in ${delay}ms...`);
        }
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
  shouldSkipLog,
  getApiKeyStatus,
  saveUserApiKey,
  clearUserApiKey,
};

export default apiClient;
