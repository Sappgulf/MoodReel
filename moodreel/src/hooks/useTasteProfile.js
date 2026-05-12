import { useCallback, useEffect, useMemo, useState } from 'react';

import { StorageKeys as SK } from '../storage/storageKeys';
import { safeGetJSON, safeSetJSON } from '../storage/safeStorage';

const STORAGE_KEY = SK.TASTE_PROFILE;
const SHOW_HIDDEN_KEY = SK.TASTE_SHOW_HIDDEN;

function readStoredJSON(key, fallback) {
  return safeGetJSON(key, fallback);
}

function getItemKey(itemOrId, mediaType) {
  if (typeof itemOrId === 'object') {
    const id = itemOrId.id;
    const type = itemOrId.media_type || mediaType || 'movie';
    return `${id}-${type}`;
  }
  return `${itemOrId}-${mediaType || 'movie'}`;
}

export function useTasteProfile() {
  const [profile, setProfile] = useState(() =>
    readStoredJSON(STORAGE_KEY, { liked: [], disliked: [] })
  );
  const [showHidden, setShowHidden] = useState(() => readStoredJSON(SHOW_HIDDEN_KEY, false));

  useEffect(() => {
    safeSetJSON(STORAGE_KEY, profile);
  }, [profile]);

  useEffect(() => {
    safeSetJSON(SHOW_HIDDEN_KEY, showHidden);
  }, [showHidden]);

  const like = useCallback((item, mediaType) => {
    const key = getItemKey(item, mediaType);
    setProfile(prev => ({
      liked: Array.from(new Set([...prev.liked, key])),
      disliked: prev.disliked.filter(id => id !== key),
    }));
  }, []);

  const dislike = useCallback((item, mediaType) => {
    const key = getItemKey(item, mediaType);
    setProfile(prev => ({
      liked: prev.liked.filter(id => id !== key),
      disliked: Array.from(new Set([...prev.disliked, key])),
    }));
  }, []);

  const clearPreference = useCallback((item, mediaType) => {
    const key = getItemKey(item, mediaType);
    setProfile(prev => ({
      liked: prev.liked.filter(id => id !== key),
      disliked: prev.disliked.filter(id => id !== key),
    }));
  }, []);

  const resetProfile = useCallback(() => {
    setProfile({ liked: [], disliked: [] });
  }, []);

  const isLiked = useCallback(
    (itemId, mediaType) => {
      return profile.liked.includes(getItemKey(itemId, mediaType));
    },
    [profile.liked]
  );

  const isDisliked = useCallback(
    (itemId, mediaType) => {
      return profile.disliked.includes(getItemKey(itemId, mediaType));
    },
    [profile.disliked]
  );

  const statusFor = useCallback(
    (itemId, mediaType) => {
      if (isLiked(itemId, mediaType)) return 'liked';
      if (isDisliked(itemId, mediaType)) return 'disliked';
      return 'neutral';
    },
    [isLiked, isDisliked]
  );

  const tasteCounts = useMemo(
    () => ({
      liked: profile.liked.length,
      disliked: profile.disliked.length,
    }),
    [profile]
  );

  return {
    profile,
    like,
    dislike,
    clearPreference,
    resetProfile,
    isLiked,
    isDisliked,
    statusFor,
    showHidden,
    setShowHidden,
    tasteCounts,
  };
}

export default useTasteProfile;
