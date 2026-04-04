import { useState, useEffect, useCallback } from 'react';

const PUSH_PERMISSION_KEY = 'moodreel-push-permission';
const PUSH_SUBSCRIPTION_KEY = 'moodreel-push-subscription';
const env = typeof process !== 'undefined' ? process.env || {} : {};

export function usePushNotifications() {
    const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');
    const [subscription, setSubscription] = useState(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        setIsSupported('Notification' in window && 'serviceWorker' in navigator);
        
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
        
        // Restore subscription from storage
        try {
            const saved = localStorage.getItem(PUSH_SUBSCRIPTION_KEY);
            if (saved) {
                setSubscription(JSON.parse(saved));
            }
        } catch {
            // ignore
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            return 'unsupported';
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        } catch (err) {
            console.error('Push notification permission error:', err);
            return 'error';
        }
    }, []);

    const subscribe = useCallback(async () => {
        if (permission !== 'granted') {
            const result = await requestPermission();
            if (result !== 'granted') return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: env.REACT_APP_VAPID_PUBLIC_KEY
            });

            const subData = sub.toJSON();
            setSubscription(subData);
            localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify(subData));
            
            return subData;
        } catch (err) {
            console.error('Push subscription error:', err);
            return null;
        }
    }, [permission, requestPermission]);

    const unsubscribe = useCallback(() => {
        if (subscription) {
            subscription.unsubscribe?.();
        }
        setSubscription(null);
        localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
    }, [subscription]);

    const showNotification = useCallback((title, options = {}) => {
        if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    ...options
                });
            });
        }
    }, []);

    return {
        permission,
        subscription,
        isSupported,
        requestPermission,
        subscribe,
        unsubscribe,
        showNotification
    };
}

export default usePushNotifications;
