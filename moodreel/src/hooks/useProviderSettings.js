import { useCallback, useEffect, useState } from 'react';

import { StorageKeys as SK } from '../storage/storageKeys';
import { safeGetJSON, safeSetJSON } from '../storage/safeStorage';

const REGION_KEY = SK.REGION;
const SERVICES_KEY = SK.MY_SERVICES;

function readStoredJSON(key, fallback) {
  return safeGetJSON(key, fallback);
}

export function useProviderSettings() {
  const [region, setRegionState] = useState(() => readStoredJSON(REGION_KEY, 'US'));
  const [myServices, setMyServices] = useState(() => readStoredJSON(SERVICES_KEY, []));

  useEffect(() => {
    safeSetJSON(REGION_KEY, region);
  }, [region]);

  useEffect(() => {
    safeSetJSON(SERVICES_KEY, myServices);
  }, [myServices]);

  const setRegion = useCallback(nextRegion => {
    setRegionState(nextRegion || 'US');
  }, []);

  const toggleService = useCallback(providerId => {
    setMyServices(prev => {
      if (prev.includes(providerId)) {
        return prev.filter(id => id !== providerId);
      }
      return [...prev, providerId];
    });
  }, []);

  const resetServices = useCallback(() => {
    setMyServices([]);
  }, []);

  return {
    region,
    setRegion,
    myServices,
    setMyServices,
    toggleService,
    resetServices,
  };
}

export default useProviderSettings;
