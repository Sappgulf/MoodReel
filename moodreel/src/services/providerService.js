import { tmdbGet, ensureArray } from './apiClient';
import { normalizeProviderList } from '../utils/mediaUtils';

const providerCache = new Map();
const catalogCache = new Map();
const PROVIDER_CACHE_LIMIT = 160;
const CATALOG_CACHE_LIMIT = 48;

function getProviderKey(id, mediaType, region) {
  return `${mediaType}-${id}-${region}`;
}

function setBounded(cache, key, value, limit) {
  cache.set(key, value);
  if (cache.size > limit) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

export async function fetchProviderCatalog(mediaType = 'movie', region = 'US', signal) {
  const cacheKey = `${mediaType}-${region}`;
  if (catalogCache.has(cacheKey)) {
    return catalogCache.get(cacheKey);
  }

  const response = await tmdbGet(`/watch/providers/${mediaType}`, {
    signal,
    params: {
      watch_region: region,
    },
    cache: true,
    ttlMs: 24 * 60 * 60 * 1000,
  });

  const providers = normalizeProviderList(ensureArray(response.results));
  setBounded(catalogCache, cacheKey, providers, CATALOG_CACHE_LIMIT);
  return providers;
}

export async function fetchTitleProviders(id, mediaType = 'movie', region = 'US', signal) {
  const cacheKey = getProviderKey(id, mediaType, region);
  if (providerCache.has(cacheKey)) {
    return providerCache.get(cacheKey);
  }

  const response = await tmdbGet(`/${mediaType}/${id}/watch/providers`, { signal });
  const regionData = response.results?.[region] || null;
  const normalized = {
    link: regionData?.link || '',
    flatrate: normalizeProviderList(regionData?.flatrate || []),
    rent: normalizeProviderList(regionData?.rent || []),
    buy: normalizeProviderList(regionData?.buy || []),
  };
  setBounded(providerCache, cacheKey, normalized, PROVIDER_CACHE_LIMIT);
  return normalized;
}

export function getCachedTitleProviders(id, mediaType = 'movie', region = 'US') {
  return providerCache.get(getProviderKey(id, mediaType, region)) || null;
}

export function clearProviderCache() {
  providerCache.clear();
  catalogCache.clear();
}

const providerService = {
  fetchProviderCatalog,
  fetchTitleProviders,
  getCachedTitleProviders,
  clearProviderCache,
};

export default providerService;
