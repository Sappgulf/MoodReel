import { tmdbGet, ensureArray } from './apiClient';
import { getMediaKey } from '../utils/mediaKeys';
import { normalizeProviderList } from '../utils/mediaUtils';

const providerCache = new Map();
const catalogCache = new Map();

function getProviderKey(id, mediaType, region) {
  return `${mediaType}-${id}-${region}`;
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
  catalogCache.set(cacheKey, providers);
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
  providerCache.set(cacheKey, normalized);
  return normalized;
}

export function getCachedTitleProviders(id, mediaType = 'movie', region = 'US') {
  return providerCache.get(getProviderKey(id, mediaType, region)) || null;
}

export async function prefetchTitleProviders(items = [], region = 'US', signal) {
  const entries = await Promise.all(
    items.map(async item => {
      const mediaType = item.media_type || 'movie';
      const key = getMediaKey(item);
      try {
        const data = await fetchTitleProviders(item.id, mediaType, region, signal);
        return [key, data];
      } catch {
        return [key, null];
      }
    })
  );
  return Object.fromEntries(entries.filter(([, value]) => value));
}

export function clearProviderCache() {
  providerCache.clear();
  catalogCache.clear();
}

const providerService = {
  fetchProviderCatalog,
  fetchTitleProviders,
  getCachedTitleProviders,
  prefetchTitleProviders,
  clearProviderCache,
};

export default providerService;
