/** Try/catch JSON helpers for restrictive storage environments */

const STORAGE_QUOTA_BYTES = 4 * 1024 * 1024; // ~4 MB conservative quota
const EVICTABLE_KEYS = [
  'moodreel-search-persistent-cache',
  'moodreel-watch-history',
  'moodreel-mood-history',
];

function getTotalStorageSize() {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  let total = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key) {
      total += (window.localStorage.getItem(key) || '').length * 2; // UTF-16
    }
  }
  return total;
}

function evictOldestIfNeeded() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (getTotalStorageSize() < STORAGE_QUOTA_BYTES) return;

  for (const key of EVICTABLE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 4) {
        parsed.splice(0, Math.ceil(parsed.length * 0.3));
        window.localStorage.setItem(key, JSON.stringify(parsed));
      } else if (typeof parsed === 'object' && parsed !== null) {
        const keys = Object.keys(parsed);
        if (keys.length > 10) {
          const sorted = keys
            .map(k => ({ key: k, ts: parsed[k]?.timestamp || 0 }))
            .sort((a, b) => a.ts - b.ts);
          const toRemove = sorted.slice(0, Math.ceil(keys.length * 0.3));
          for (const { key: rk } of toRemove) {
            delete parsed[rk];
          }
          window.localStorage.setItem(key, JSON.stringify(parsed));
        }
      }
      if (getTotalStorageSize() < STORAGE_QUOTA_BYTES) break;
    } catch {
      window.localStorage.removeItem(key);
      if (getTotalStorageSize() < STORAGE_QUOTA_BYTES) break;
    }
  }
}

export function safeGetJSON(key, fallback) {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function safeSetJSON(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    evictOldestIfNeeded();
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
