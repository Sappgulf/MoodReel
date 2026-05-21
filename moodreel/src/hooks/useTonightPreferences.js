import { useCallback, useEffect, useState } from 'react';

import { RUNTIME_OPTIONS } from '../constants/tonightOptions';
import { safeGetJSON, safeSetJSON } from '../storage/safeStorage';
import { StorageKeys as SK } from '../storage/storageKeys';
import { TONIGHT_MODES } from '../utils/recommendationScoring';

const RUNTIME_VALUES = RUNTIME_OPTIONS.map(option => option.value);
const WATCHING_CONTEXT_IDS = new Set(['solo', 'date', 'family', 'friends']);
const RISK_IDS = new Set(['safe', 'balanced', 'adventurous']);
const CONTENT_TYPES = new Set(['all', 'movie', 'tv']);

export const TONIGHT_PREFERENCES_DEFAULTS = Object.freeze({
  mood: 'cozy crowd pleasing',
  runtimeLimit: 120,
  contentType: 'all',
  watchingContext: 'friends',
  riskPreference: 'balanced',
  servicesOnly: false,
  minRating: 6.5,
  hideDisliked: true,
  hideWatched: true,
  tonightMode: 'easy-win',
});

function isValidTonightMode(id) {
  return TONIGHT_MODES.some(mode => mode.id === id);
}

function defaultConstraintsForMode(tonightMode) {
  const mode = TONIGHT_MODES.find(entry => entry.id === tonightMode) || TONIGHT_MODES[0];
  return [...mode.defaultConstraints];
}

function sanitizeConstraintIds(raw, tonightMode) {
  if (!Array.isArray(raw)) {
    return defaultConstraintsForMode(tonightMode);
  }
  const validIds = new Set(raw.filter(id => typeof id === 'string' && id.length > 0));
  return validIds.size > 0 ? Array.from(validIds) : defaultConstraintsForMode(tonightMode);
}

export function sanitizeTonightPreferences(raw = {}) {
  const tonightMode = isValidTonightMode(raw.tonightMode)
    ? raw.tonightMode
    : TONIGHT_PREFERENCES_DEFAULTS.tonightMode;

  const runtimeNumber = Number(raw.runtimeLimit);
  const runtimeLimit = RUNTIME_VALUES.includes(runtimeNumber)
    ? runtimeNumber
    : TONIGHT_PREFERENCES_DEFAULTS.runtimeLimit;

  const minRatingNumber = Number(raw.minRating);
  const minRating =
    Number.isFinite(minRatingNumber) && minRatingNumber >= 0 && minRatingNumber <= 10
      ? minRatingNumber
      : TONIGHT_PREFERENCES_DEFAULTS.minRating;

  return {
    mood:
      typeof raw.mood === 'string' && raw.mood.trim()
        ? raw.mood
        : TONIGHT_PREFERENCES_DEFAULTS.mood,
    runtimeLimit,
    contentType: CONTENT_TYPES.has(raw.contentType)
      ? raw.contentType
      : TONIGHT_PREFERENCES_DEFAULTS.contentType,
    watchingContext: WATCHING_CONTEXT_IDS.has(raw.watchingContext)
      ? raw.watchingContext
      : TONIGHT_PREFERENCES_DEFAULTS.watchingContext,
    riskPreference: RISK_IDS.has(raw.riskPreference)
      ? raw.riskPreference
      : TONIGHT_PREFERENCES_DEFAULTS.riskPreference,
    servicesOnly:
      typeof raw.servicesOnly === 'boolean'
        ? raw.servicesOnly
        : TONIGHT_PREFERENCES_DEFAULTS.servicesOnly,
    minRating,
    hideDisliked:
      typeof raw.hideDisliked === 'boolean'
        ? raw.hideDisliked
        : TONIGHT_PREFERENCES_DEFAULTS.hideDisliked,
    hideWatched:
      typeof raw.hideWatched === 'boolean'
        ? raw.hideWatched
        : TONIGHT_PREFERENCES_DEFAULTS.hideWatched,
    tonightMode,
    activeConstraintIds: sanitizeConstraintIds(raw.activeConstraintIds, tonightMode),
  };
}

export function useTonightPreferences() {
  const [preferences, setPreferencesState] = useState(() =>
    sanitizeTonightPreferences(safeGetJSON(SK.TONIGHT_PREFERENCES, {}))
  );

  useEffect(() => {
    safeSetJSON(SK.TONIGHT_PREFERENCES, preferences);
  }, [preferences]);

  const setPreference = useCallback((key, value) => {
    setPreferencesState(prev => {
      const next = sanitizeTonightPreferences({ ...prev, [key]: value });
      if (key === 'tonightMode' && isValidTonightMode(value)) {
        next.activeConstraintIds = defaultConstraintsForMode(value);
      }
      return next;
    });
  }, []);

  const updatePreferences = useCallback(partial => {
    setPreferencesState(prev => sanitizeTonightPreferences({ ...prev, ...partial }));
  }, []);

  const setActiveConstraintIds = useCallback(updater => {
    setPreferencesState(prev => {
      const current = prev.activeConstraintIds;
      const nextIds = typeof updater === 'function' ? updater(current) : updater;
      return sanitizeTonightPreferences({
        ...prev,
        activeConstraintIds: nextIds,
      });
    });
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferencesState(sanitizeTonightPreferences({}));
  }, []);

  return {
    preferences,
    setPreference,
    updatePreferences,
    setActiveConstraintIds,
    resetPreferences,
  };
}

export default useTonightPreferences;
