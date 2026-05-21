/**
 * Canonical localStorage keys for MoodReel (single source of truth).
 * Bump STORAGE_SCHEMA_VERSION if you redesign persisted shape.
 */

export const StorageKeys = Object.freeze({
  ACHIEVEMENTS: 'moodreel-achievements',
  ACHIEVEMENT_STATS: 'moodreel-achievement-stats',
  ADMIN: 'moodreel-admin',
  CUSTOM_PLAYLISTS: 'moodreel-custom-playlists',
  FAVORITES_LEGACY: 'moodreel_favorites',
  INSTALL_DISMISSED: 'moodreel-install-dismissed',
  MOOD_HISTORY: 'moodreel-mood-history',
  MOOD_HISTORY_DATED: 'moodreel-mood-history-dated',
  NOTES: 'moodreel_notes',
  ONBOARDED: 'moodreel-onboarded',
  PROFILE: 'moodreel_profile',
  PUSH_SUBSCRIPTION: 'moodreel-push-subscription',
  RATE_LIMIT: 'moodreel-rate-limit',
  RATINGS: 'moodreel-ratings',
  RECENT_SEARCHES: 'moodreel-recent-searches',
  REGION: 'moodreel-region',
  MY_SERVICES: 'moodreel-my-services',
  SEARCH_CACHE: 'moodreel-search-persistent-cache',
  SOUNDS: 'moodreel-sounds',
  SURPRISE_SEEN: 'moodreel-surprise-seen',
  TASTE_PROFILE: 'moodreel-taste-profile',
  TASTE_SHOW_HIDDEN: 'moodreel-taste-show-hidden',
  THEME_AUTO: 'moodreel-theme-auto',
  THEME: 'moodreel-theme',
  TMDB_API_KEY_USER: 'moodreel-tmdb-api-key',
  WATCHED: 'moodreel_watched',
  WATCHLIST: 'moodreel_watchlist',
  WATCH_HISTORY: 'moodreel-watch-history',
  TONIGHT_PREFERENCES: 'moodreel-tonight-preferences',
});

/** Increment when migrating persisted payloads (manual or scripted). */
export const STORAGE_SCHEMA_VERSION = 2;
