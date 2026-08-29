import { useEffect, useState } from 'react';
import { fetchProviderCatalog } from '../services/providerService';
import { shouldSkipLog } from '../services/apiErrorUtils';

/**
 * The streaming providers available in a region, merged across movies and TV
 * and de-duplicated by provider id.
 */
export function useProviderCatalog(region) {
  const [providerCatalog, setProviderCatalog] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const loadProviders = async () => {
      try {
        const [movieProviders, tvProviders] = await Promise.all([
          fetchProviderCatalog('movie', region, controller.signal),
          fetchProviderCatalog('tv', region, controller.signal),
        ]);
        const merged = [...movieProviders, ...tvProviders].reduce((acc, provider) => {
          if (!acc.some(p => p.id === provider.id)) {
            acc.push(provider);
          }
          return acc;
        }, []);
        setProviderCatalog(merged);
      } catch (err) {
        if (!shouldSkipLog(err)) {
          console.error('Error fetching provider catalog:', err);
        }
      }
    };

    loadProviders();
    return () => controller.abort();
  }, [region]);

  return providerCatalog;
}

export default useProviderCatalog;
