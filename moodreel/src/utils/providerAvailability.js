import { getMediaKey } from './mediaKeys';
import { normalizeProviderList } from './mediaUtils';

export function collectProviderIds(providerData) {
  if (!providerData) return [];
  const lists = [
    ...(providerData.flatrate || []),
    ...(providerData.rent || []),
    ...(providerData.buy || []),
  ];
  return lists.map(p => p.id ?? p.provider_id).filter(Boolean);
}

/** pending | confirmed | unavailable | unknown */
export function getProviderAvailabilityStatus(item, providerMap, myServices = [], region = 'US') {
  if (!myServices.length) return 'unknown';
  const key = getMediaKey(item);
  const data = providerMap?.[key];
  if (!data) return 'pending';
  const ids = collectProviderIds(data);
  if (!ids.length) return 'unavailable';
  return myServices.some(id => ids.includes(id)) ? 'confirmed' : 'unavailable';
}

export function providerBadgesFromData(providerData, myServices = []) {
  if (!providerData) return [];
  const flat = normalizeProviderList([
    ...(providerData.flatrate || []),
    ...(providerData.rent || []),
    ...(providerData.buy || []),
  ]);
  if (!myServices.length) return flat.slice(0, 4);
  const onMine = flat.filter(p => myServices.includes(p.id));
  return (onMine.length ? onMine : flat).slice(0, 4);
}

export function availabilityLabel(status) {
  switch (status) {
    case 'confirmed':
      return 'On your services';
    case 'pending':
      return 'Checking availability…';
    case 'unavailable':
      return 'Not on your services';
    default:
      return 'Availability unknown';
  }
}
