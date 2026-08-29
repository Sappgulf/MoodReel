import { useState, useCallback } from 'react';
import { resolvePublicEnv } from '../utils/publicEnv';
import { StorageKeys as SK } from '../storage/storageKeys';
import { safeGetJSON, safeSetJSON, safeRemove } from '../storage/safeStorage';

/** VITE_VAPID_PUBLIC_KEY preferred; legacy REACT_APP_VAPID_PUBLIC_KEY supported. */
function getVapidPublicKey() {
  return resolvePublicEnv(['VITE_VAPID_PUBLIC_KEY', 'REACT_APP_VAPID_PUBLIC_KEY']);
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  // Subscription and support are read once at mount: browser capability is
  // static, and the stored subscription only changes through this hook.
  const [subscription, setSubscription] = useState(() => safeGetJSON(SK.PUSH_SUBSCRIPTION, null));
  const [isSupported] = useState(
    () =>
      typeof window !== 'undefined' &&
      'Notification' in window &&
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator
  );

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
      safeSetJSON(SK.PUSH_SUBSCRIPTION, subData);

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
    } catch {
      // silently fail if pushManager is unavailable
    }
    setSubscription(null);
    safeRemove(SK.PUSH_SUBSCRIPTION);
  }, []);

  const showNotification = useCallback((title, options = {}) => {
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
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
