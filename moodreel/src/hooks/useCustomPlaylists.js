import { useState, useEffect, useCallback } from 'react';

import { safeGetJSON, safeSetJSON } from '../storage/safeStorage';
import { StorageKeys as SK } from '../storage/storageKeys';

const CUSTOM_PLAYLISTS_KEY = SK.CUSTOM_PLAYLISTS;

export function useCustomPlaylists() {
  const [playlists, setPlaylists] = useState(() => {
    return safeGetJSON(CUSTOM_PLAYLISTS_KEY, []);
  });

  useEffect(() => {
    safeSetJSON(CUSTOM_PLAYLISTS_KEY, playlists);
  }, [playlists]);

  const savePlaylist = useCallback((name, filters) => {
    const newPlaylist = {
      id: Date.now().toString(),
      name,
      desc: `Custom vibes for ${name}`,
      filters: { ...filters },
      color: '#764ba2', // Default custom color
    };

    setPlaylists(prev => [...prev, newPlaylist]);
  }, []);

  const deletePlaylist = useCallback(id => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  return {
    playlists,
    savePlaylist,
    deletePlaylist,
  };
}

export default useCustomPlaylists;
