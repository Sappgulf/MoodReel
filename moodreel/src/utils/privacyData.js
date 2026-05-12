import { StorageKeys, STORAGE_SCHEMA_VERSION } from '../storage/storageKeys';
import { safeGetRaw, safeSetRaw, safeRemove } from '../storage/safeStorage';

export const PRIVACY_DATA_VERSION = 1;

const EXPORTABLE_KEYS = Object.freeze(
  Object.values(StorageKeys).filter(key => !key.includes('tmdb-api-key'))
);

export function getExportableStorageKeys() {
  return [...EXPORTABLE_KEYS];
}

export function createPrivacyExport({ now = () => new Date() } = {}) {
  const payload = {};
  const payloadMeta = {
    app: 'MoodReel',
    version: PRIVACY_DATA_VERSION,
    storageSchemaVersion: STORAGE_SCHEMA_VERSION,
    exportedAt: now().toISOString(),
  };

  if (typeof window === 'undefined') return { ...payloadMeta, payload };

  EXPORTABLE_KEYS.forEach(key => {
    const raw = safeGetRaw(key, null);
    if (raw !== null) {
      payload[key] = raw;
    }
  });

  return {
    ...payloadMeta,
    payload,
  };
}

export function downloadPrivacyExport() {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return false;

  const exportData = createPrivacyExport();
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `moodreel-data-${exportData.exportedAt.slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}

export function parsePrivacyImport(rawData) {
  const parsed = JSON.parse(rawData);
  if (!parsed || parsed.app !== 'MoodReel' || typeof parsed.payload !== 'object') {
    throw new Error('This does not look like a MoodReel data export.');
  }

  const allowedKeys = new Set(EXPORTABLE_KEYS);
  const entries = Object.entries(parsed.payload).filter(([key, value]) => {
    return allowedKeys.has(key) && typeof value === 'string';
  });

  return entries;
}

export function importPrivacyData(rawData) {
  const entries = parsePrivacyImport(rawData);
  if (typeof window === 'undefined') return 0;

  entries.forEach(([key, value]) => {
    safeSetRaw(key, value);
  });

  return entries.length;
}

export function clearMoodReelData() {
  EXPORTABLE_KEYS.forEach(key => safeRemove(key));
}
