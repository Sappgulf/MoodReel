import { normalizeProviderList } from './mediaUtils';

/** @typedef {{ flatrate?: unknown[]; rent?: unknown[]; buy?: unknown[] }} ProviderGroups */

/**
 * Collect normalized provider IDs from TMDB watch-provider payload.
 * @param {ProviderGroups | null | undefined} providerData
 */
export function collectProviderIds(providerData) {
  if (!providerData) return [];
  const groups = [
    ...(providerData.flatrate || []),
    ...(providerData.rent || []),
    ...(providerData.buy || []),
  ];
  const normalized = normalizeProviderList(
    groups.map(entry =>
      entry?.provider_id != null
        ? entry
        : entry?.id != null
          ? { provider_id: entry.id, provider_name: entry.name, logo_path: entry.logoPath }
          : entry
    )
  );
  return normalized.map(p => p.id);
}

/**
 * Whether a title's provider groups overlap selected streaming service IDs.
 * @param {ProviderGroups | null | undefined} providerData
 * @param {number[]} selectedProviderIds
 */
export function itemMatchesSelectedProviders(providerData, selectedProviderIds = []) {
  if (!selectedProviderIds.length) return true;
  const ids = collectProviderIds(providerData);
  return selectedProviderIds.some(id => ids.includes(id));
}
