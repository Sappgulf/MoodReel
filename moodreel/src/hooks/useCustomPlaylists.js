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

function emojiForMood(mood) {
  if (!mood || typeof mood !== 'string') return '🎬';
  const normalized = mood.toLowerCase();
  if (/happy|joy|fun|comedy|laugh|uplift/.test(normalized)) return '😄';
  if (/sad|drama|emotion|tear|cry/.test(normalized)) return '😢';
  if (/scary|horror|thriller|creep|dark/.test(normalized)) return '😱';
  if (/romance|love|date|romantic/.test(normalized)) return '💕';
  if (/sci-?fi|space|future/.test(normalized)) return '🚀';
  if (/action|fight|adrenalin|thrill/.test(normalized)) return '⚔️';
  if (/fantasy|magic|wizard/.test(normalized)) return '🧙';
  if (/mystery|whodunit/.test(normalized)) return '🔍';
  if (/family|kid/.test(normalized)) return '👨‍👩‍👧';
  if (/cozy|comfy|warm|comfort/.test(normalized)) return '☕';
  if (/documentary/.test(normalized)) return '📚';
  if (/noir|crime/.test(normalized)) return '🕵️';
  return '🎬';
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

  const shareableVibePreview = useCallback((name, filters) => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams();
    const title = name || 'A MoodReel vibe';
    params.set('title', title);
    if (filters?.mood) {
      params.set('mood', String(filters.mood).slice(0, 32));
    }
    if (Array.isArray(filters?.selectedGenres) && filters.selectedGenres.length > 0) {
      params.set('genres', filters.selectedGenres.join(','));
    }
    // Pick an emoji that matches the mood where we can.
    const moodEmoji = emojiForMood(filters?.mood);
    params.set('emoji', moodEmoji);
    return `${window.location.origin}/api/og-vibe?${params.toString()}`;
  }, []);

  return {
    playlists,
    savePlaylist,
    updatePlaylist,
    movePlaylist,
    deletePlaylist,
    shareableVibeUrl,
    shareableVibePreview,
  };
}

export default useCustomPlaylists;
