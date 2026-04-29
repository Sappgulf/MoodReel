import { useState, useEffect, useCallback } from 'react';
import { resolvePublicEnv } from '../utils/publicEnv';

const PUSH_SUBSCRIPTION_KEY = 'moodreel-push-subscription';

/** VITE_VAPID_PUBLIC_KEY preferred; legacy REACT_APP_VAPID_PUBLIC_KEY supported. */
function getVapidPublicKey() {
  return resolvePublicEnv(['VITE_VAPID_PUBLIC_KEY', 'REACT_APP_VAPID_PUBLIC_KEY']);
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
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

      const applicationServerKey = getVapidPublicKey();
      if (!applicationServerKey) {
        console.error(
          'Push: set VITE_VAPID_PUBLIC_KEY (or legacy REACT_APP_VAPID_PUBLIC_KEY) in .env.'
        );
        return null;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
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

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }
    } catch (err) {
      // silently fail if pushManager is unavailable
    }
    setSubscription(null);
    localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
  }, []);

  const showNotification = useCallback((title, options = {}) => {
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          icon: '/logo192.png',
          badge: '/logo192.png',
          ...options,
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
    showNotification,
  };
}

export default usePushNotifications;
