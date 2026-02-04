import { useCallback, useEffect, useState } from 'react';

const REGION_KEY = 'moodreel-region';
const SERVICES_KEY = 'moodreel-my-services';

function readStoredJSON(key, fallback) {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return fallback;
        const parsed = JSON.parse(stored);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

export function useProviderSettings() {
    const [region, setRegionState] = useState(() => readStoredJSON(REGION_KEY, 'US'));
    const [myServices, setMyServices] = useState(() => readStoredJSON(SERVICES_KEY, []));

    useEffect(() => {
        try {
            localStorage.setItem(REGION_KEY, JSON.stringify(region));
        } catch {
            // ignore
        }
    }, [region]);

    useEffect(() => {
        try {
            localStorage.setItem(SERVICES_KEY, JSON.stringify(myServices));
        } catch {
            // ignore
        }
    }, [myServices]);

    const setRegion = useCallback((nextRegion) => {
        setRegionState(nextRegion || 'US');
    }, []);

    const toggleService = useCallback((providerId) => {
        setMyServices((prev) => {
            if (prev.includes(providerId)) {
                return prev.filter((id) => id !== providerId);
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
        resetServices
    };
}

export default useProviderSettings;
