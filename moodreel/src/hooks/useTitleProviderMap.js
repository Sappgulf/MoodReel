import { useEffect, useMemo, useState } from 'react';
import { getMediaKey } from '../utils/mediaKeys';
import { getCachedTitleProviders, prefetchTitleProviders } from '../services/providerService';

export function useTitleProviderMap(
  items = [],
  region = 'US',
  { enabled = true, limit = 24 } = {}
) {
  const [providerMap, setProviderMap] = useState({});
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);

  const slice = useMemo(() => items.slice(0, limit), [items, limit]);

  useEffect(() => {
    if (!enabled || !slice.length) {
      setIsLoadingProviders(false);
      return undefined;
    }

    const controller = new AbortController();
    const seed = {};
    slice.forEach(item => {
      const mediaType = item.media_type || 'movie';
      const cached = getCachedTitleProviders(item.id, mediaType, region);
      if (cached) seed[getMediaKey(item)] = cached;
    });
    if (Object.keys(seed).length) {
      setProviderMap(prev => ({ ...prev, ...seed }));
    }

    setIsLoadingProviders(true);
    prefetchTitleProviders(slice, region, controller.signal)
      .then(map => {
        if (!controller.signal.aborted && Object.keys(map).length) {
          setProviderMap(prev => ({ ...prev, ...map }));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingProviders(false);
      });

    return () => {
      controller.abort();
      setIsLoadingProviders(false);
    };
  }, [slice, region, enabled]);

  return { providerMap, isLoadingProviders };
}

export function useProviderMatches(providerMap, myServices = []) {
  return useMemo(() => {
    const matches = new Set();
    if (!myServices.length) return matches;
    for (const [key, value] of Object.entries(providerMap)) {
      const ids = [...(value?.flatrate || []), ...(value?.rent || []), ...(value?.buy || [])].map(
        p => p.id ?? p.provider_id
      );
      if (ids.some(id => myServices.includes(id))) matches.add(key);
    }
    return matches;
  }, [providerMap, myServices]);
}
