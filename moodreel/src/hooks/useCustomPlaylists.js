import { useState, useEffect, useCallback } from 'react';

const CUSTOM_PLAYLISTS_KEY = 'moodreel-custom-playlists';

export function useCustomPlaylists() {
  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PLAYLISTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(playlists));
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
