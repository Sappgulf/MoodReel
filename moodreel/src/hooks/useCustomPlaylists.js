import { useState, useEffect, useCallback } from 'react';

import { safeGetJSON, safeSetJSON } from '../storage/safeStorage';
import { StorageKeys as SK } from '../storage/storageKeys';
import { encodeSharePayload } from '../utils/clipboard';

const CUSTOM_PLAYLISTS_KEY = SK.CUSTOM_PLAYLISTS;

function createPlaylistId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useCustomPlaylists() {
  const [playlists, setPlaylists] = useState(() => {
    return safeGetJSON(CUSTOM_PLAYLISTS_KEY, []);
  });

  useEffect(() => {
    safeSetJSON(CUSTOM_PLAYLISTS_KEY, playlists);
  }, [playlists]);

  const savePlaylist = useCallback((name, filters) => {
    const newPlaylist = {
      id: createPlaylistId(),
      name,
      desc: `Custom vibes for ${name}`,
      filters: { ...filters },
      color: '#764ba2', // Default custom color
    };

    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  }, []);

  const updatePlaylist = useCallback((id, updates) => {
    setPlaylists(prev =>
      prev.map(playlist =>
        playlist.id === id
          ? {
              ...playlist,
              ...updates,
              filters: updates.filters ? { ...updates.filters } : playlist.filters,
            }
          : playlist
      )
    );
  }, []);

  const movePlaylist = useCallback((id, direction) => {
    setPlaylists(prev => {
      const index = prev.findIndex(playlist => playlist.id === id);
      if (index < 0) return prev;
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }, []);

  const deletePlaylist = useCallback(id => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  const shareableVibeUrl = useCallback((name, filters) => {
    if (typeof window === 'undefined') return '';
    const payload = {
      type: 'vibe',
      name: name || 'Shared vibe',
      v: 1,
      filters: {
        mood: filters?.mood || '',
        contentType: filters?.contentType || 'all',
        selectedGenres: filters?.selectedGenres || [],
        selectedProviders: filters?.selectedProviders || [],
        minRating: filters?.minRating || 0,
        advancedFilters: filters?.advancedFilters || {},
      },
    };
    const encoded = encodeSharePayload(payload);
    const origin = window.location.origin || '';
    return `${origin}/shared?data=${encoded}`;
  }, []);

  return {
    playlists,
    savePlaylist,
    updatePlaylist,
    movePlaylist,
    deletePlaylist,
    shareableVibeUrl,
  };
}

export default useCustomPlaylists;
