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
const PROXY_URL = '/api/tmdb';
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const API_KEY_SOURCE_USER = 'user';
const API_KEY_SOURCE_ENV = 'environment';
const API_KEY_SOURCE_BOOTSTRAP = 'bootstrap';
const API_KEY_SOURCE_PROXY = 'proxy';
const API_KEY_SOURCE_MISSING = 'missing';

let proxyAvailable = true;
// Distinct from `proxyAvailable`: the endpoint exists and answers, but the
// deployment has no server-side TMDB key. That is a setup problem worth
// reporting honestly rather than a reason to change transport.
let proxyConfigured = true;
const PROXY_NOT_CONFIGURED = 'PROXY_NOT_CONFIGURED';

function resolveClientApiKeyStatus() {
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

// In a production build the proxy is the only viable transport: the deployed
// Content-Security-Policy restricts connect-src to 'self', so a direct call to
// api.themoviedb.org is blocked by the browser no matter which key made it.
//
// This previously deferred to any client-side key, which meant a build-time
// VITE_TMDB_API_KEY both baked a secret into the public bundle and pushed
// every request onto the blocked direct path, leaving the deployed app unable
// to load anything. Client keys remain the dev/local workflow, where the CSP
// does not apply.
function shouldUseProxy() {
  if (!proxyAvailable) return false;
  if (typeof window === 'undefined') return false;
  if (import.meta.env.DEV) return false;
  return true;
}

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
  // The proxy takes precedence when it is in use, otherwise the UI would claim
  // a client key is serving requests that actually go through the server. A
  // proxy that has told us it lacks a key is deliberately not counted as
  // configured, so the app surfaces the problem instead of failing silently.
  if (shouldUseProxy() && proxyConfigured) {
    return {
      configured: true,
      source: API_KEY_SOURCE_PROXY,
      value: null,
      hasKey: true,
    };
  }

  const clientStatus = resolveClientApiKeyStatus();
  if (clientStatus.hasKey) return clientStatus;

  return {
    configured: false,
    source: API_KEY_SOURCE_MISSING,
    value: null,
    hasKey: false,
    // The deployment's proxy answered but has no server-side key. A visitor
    // cannot fix that with their own key, so the UI says something different.
    proxyUnconfigured: shouldUseProxy() && !proxyConfigured,
  };
}

export const API_KEY_CHANGED_EVENT = 'moodreel:api-key-updated';

/**
 * Broadcast an API-key change so every `useApiKeyStatus` subscriber re-reads
 * the status from storage. Call after any mutation of the stored key.
 */
export function notifyApiKeyChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(API_KEY_CHANGED_EVENT));
}

export function saveUserApiKey(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    safeRemove(SK.TMDB_API_KEY_USER);
    notifyApiKeyChange();
    return false;
  }
  const saved = safeSetRaw(SK.TMDB_API_KEY_USER, trimmed);
  notifyApiKeyChange();
  return saved;
}

export function clearUserApiKey() {
  safeRemove(SK.TMDB_API_KEY_USER);
  notifyApiKeyChange();
}

function getApiKey() {
  return resolveClientApiKeyStatus().value;
}

export async function testTmdbConnection() {
  await tmdbGet('/configuration', {
    retries: 0,
    cache: false,
  });
  return true;
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
  memoryCache.delete(key);
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
      retryable: true,
      cause: err,
    });
  }

  const retryAfterHeader = err?.response?.headers?.['retry-after'];
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null;

  const error = new TmdbApiError({
    code: `TMDB_HTTP_${status}`,
    message: body?.status_message || getUserFacingMessage({ code: `TMDB_HTTP_${status}`, status }),
    path,
    status,
    retryAfter,
    // A proxy with no key configured will not fix itself by being asked again.
    retryable:
      body?.code !== PROXY_NOT_CONFIGURED && (status >= 500 || status === 429 || status === 408),
    cause: err,
  });
  // Carry the proxy's own marker so callers can tell a deployment setup
  // problem apart from an upstream outage.
  error.proxyCode = body?.code;
  return error;
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

function buildProxyUrl(path, params) {
  const url = new URL(PROXY_URL, window.location.origin);
  url.searchParams.set('path', path);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

export async function tmdbGet(
  path,
  { params = {}, signal, cache = false, ttlMs = DEFAULT_TTL_MS, retries = MAX_RETRIES } = {}
) {
  const useProxy = shouldUseProxy();

  if (!useProxy) {
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
  }

  const finalParams = useProxy ? { ...params } : { ...params, api_key: getApiKey() };
  const cacheKey = cache ? getCacheKey(path, finalParams) : null;

  if (cache && cacheKey) {
    const cached = getCached(cacheKey, ttlMs);
    if (cached) return cached;
  }

  const makeRequest = async () => {
    if (useProxy) {
      const url = buildProxyUrl(path, finalParams);
      return axios.get(url, {
        signal,
        timeout: DEFAULT_REQUEST_TIMEOUT_MS,
      });
    }
    return axios.get(`${API_BASE_URL}${path}`, {
      params: finalParams,
      signal,
      timeout: DEFAULT_REQUEST_TIMEOUT_MS,
    });
  };

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await makeRequest();

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

      if (useProxy && normalized.status === 404) {
        proxyAvailable = false;
      }

      if (useProxy && normalized.proxyCode === PROXY_NOT_CONFIGURED) {
        proxyConfigured = false;
        notifyApiKeyChange();
      }

      if (import.meta.env.DEV && !shouldSkipLog(normalized)) {
        console.error(
          `TMDB API Error [${path}] (attempt ${attempt + 1}/${retries + 1}): ${normalized.message}`,
          {
            code: normalized.code,
            status: normalized.status,
            retryAfter: normalized.retryAfter,
          }
        );
      }

      if (attempt < retries && isRetryableError(normalized)) {
        const serverDelay = normalized.retryAfter ? normalized.retryAfter * 1000 : 0;
        const delay = Math.max(serverDelay, BASE_RETRY_DELAY_MS * Math.pow(2, attempt));
        if (import.meta.env.DEV) {
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
  notifyApiKeyChange,
  saveUserApiKey,
  clearUserApiKey,
  testTmdbConnection,
};

export default apiClient;
