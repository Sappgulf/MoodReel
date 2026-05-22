/**
 * Check if TMDB watch/providers payload includes any selected service IDs.
 */
export function itemMatchesSelectedProviders(providerData, selectedProviderIds = []) {
  if (!providerData || !selectedProviderIds.length) return false;

  const collectIds = list => (list || []).map(p => p.provider_id ?? p.id).filter(Boolean);

  const available = [
    ...collectIds(providerData.flatrate),
    ...collectIds(providerData.rent),
    ...collectIds(providerData.buy),
  ];

  return selectedProviderIds.some(id => available.includes(id));
}
