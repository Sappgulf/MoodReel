import { useCallback, useSyncExternalStore } from 'react';
import { API_KEY_CHANGED_EVENT, getApiKeyStatus } from '../services/apiClient';

const HAS_WINDOW = typeof window !== 'undefined';

// `getApiKeyStatus()` builds a fresh object on every call, so it can't be used
// as a `useSyncExternalStore` snapshot directly — React would see a new
// reference each render and loop. We cache the snapshot and only replace it
// when the serialized status actually changes.
let snapshot = getApiKeyStatus();
let snapshotSignature = JSON.stringify(snapshot);

function readSnapshot() {
  const next = getApiKeyStatus();
  const signature = JSON.stringify(next);
  if (signature !== snapshotSignature) {
    snapshot = next;
    snapshotSignature = signature;
  }
  return snapshot;
}

function subscribe(onStoreChange) {
  if (!HAS_WINDOW) return () => {};
  window.addEventListener(API_KEY_CHANGED_EVENT, onStoreChange);
  // `storage` fires when another tab saves or clears the key.
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener(API_KEY_CHANGED_EVENT, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

/**
 * Read the current TMDB API key status as a subscribed external store, so
 * every consumer stays in sync without state-syncing effects.
 */
export function useApiKeyStatus() {
  const getSnapshot = useCallback(() => readSnapshot(), []);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export default useApiKeyStatus;
