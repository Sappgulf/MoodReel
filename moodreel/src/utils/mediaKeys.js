const DEFAULT_MEDIA_TYPE = 'movie';

export function getMediaType(itemOrType, fallback = DEFAULT_MEDIA_TYPE) {
  if (typeof itemOrType === 'string') return itemOrType || fallback;
  return itemOrType?.media_type || fallback;
}

export function getMediaId(itemOrId) {
  if (typeof itemOrId === 'object') return itemOrId?.id;
  return itemOrId;
}

/** Canonical key: `movie:123` */
export function getMediaKey(itemOrId, mediaType) {
  const id = getMediaId(itemOrId);
  const type = getMediaType(
    typeof itemOrId === 'object' ? itemOrId : null,
    mediaType || DEFAULT_MEDIA_TYPE
  );
  if (id === undefined || id === null) return '';
  return `${type}:${id}`;
}

/** Accept legacy `123-movie` and normalize to canonical. */
export function normalizeMediaKey(key) {
  if (!key || typeof key !== 'string') return '';
  if (key.includes(':')) {
    const [type, id] = key.split(':');
    if (type && id) return `${type}:${id}`;
  }
  const legacy = key.match(/^(\d+)-(movie|tv)$/);
  if (legacy) return `${legacy[2]}:${legacy[1]}`;
  return key;
}

export function migrateKeyList(keys = []) {
  return Array.from(new Set(keys.map(normalizeMediaKey).filter(Boolean)));
}

export function migrateTasteProfile(profile = { liked: [], disliked: [] }) {
  return {
    liked: migrateKeyList(profile.liked || []),
    disliked: migrateKeyList(profile.disliked || []),
  };
}

export function keysFromItems(items = []) {
  return new Set(items.map(item => getMediaKey(item)).filter(Boolean));
}

export function buildScoringContext({
  selectedGenres = [],
  providerMatches = new Set(),
  profile = { liked: [], disliked: [] },
  watchlist = [],
  watched = {},
  watchedKeys = null,
  favorites = [],
  availableMinutes = null,
  showHidden = false,
} = {}) {
  const likedKeys = new Set(migrateKeyList(profile.liked));
  const dislikedKeys = new Set(migrateKeyList(profile.disliked));
  const hiddenKeys = showHidden ? new Set() : dislikedKeys;

  return {
    selectedGenres,
    providerMatches,
    likedKeys,
    dislikedKeys,
    hiddenKeys,
    watchlistKeys: keysFromItems(watchlist),
    favoriteKeys: keysFromItems(favorites),
    watchedKeys:
      watchedKeys ||
      new Set(
        Object.keys(watched || {})
          .map(normalizeMediaKey)
          .filter(Boolean)
      ),
    availableMinutes,
  };
}
