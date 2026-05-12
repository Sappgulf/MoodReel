import { useState, useEffect, useCallback, useMemo } from 'react';
import { StorageKeys as SK } from '../storage/storageKeys';
import { safeGetJSON, safeSetJSON } from '../storage/safeStorage';

function getMediaKey(itemOrId, mediaType) {
  if (typeof itemOrId === 'object' && itemOrId !== null) {
    return `${itemOrId.id}-${itemOrId.media_type || mediaType || 'movie'}`;
  }
  if (!mediaType) return String(itemOrId);
  return `${itemOrId}-${mediaType || 'movie'}`;
}

/**
 * Custom hook for managing watchlist with localStorage persistence
 * Includes notes, watched status, and genre tracking
 */
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    return safeGetJSON(SK.WATCHLIST, []);
  });

  const [notes, setNotes] = useState(() => {
    return safeGetJSON(SK.NOTES, {});
  });

  const [watched, setWatched] = useState(() => {
    return safeGetJSON(SK.WATCHED, {});
  });

  // Persist watchlist
  useEffect(() => {
    safeSetJSON(SK.WATCHLIST, watchlist);
  }, [watchlist]);

  // Persist notes
  useEffect(() => {
    safeSetJSON(SK.NOTES, notes);
  }, [notes]);

  // Persist watched
  useEffect(() => {
    safeSetJSON(SK.WATCHED, watched);
  }, [watched]);

  const addToWatchlist = useCallback(item => {
    let added = null;
    setWatchlist(prev => {
      // Check if already exists inside the updater to avoid stale closure
      const newKey = getMediaKey(item);
      const existing = prev.some(i => getMediaKey(i) === newKey);
      if (existing) return prev;

      const newItem = {
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        media_type: item.media_type || 'movie',
        genre_ids: item.genre_ids || [],
        addedAt: Date.now(),
      };
      added = newItem;
      return [...prev, newItem];
    });
    return added; // Return for external tracking (achievements)
  }, []);

  const removeFromWatchlist = useCallback((id, mediaType) => {
    const key = mediaType ? getMediaKey(id, mediaType) : null;
    setWatchlist(prev =>
      key ? prev.filter(item => getMediaKey(item) !== key) : prev.filter(item => item.id !== id)
    );
    setNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[key || id];
      delete newNotes[id];
      return newNotes;
    });
    setWatched(prev => {
      const newWatched = { ...prev };
      delete newWatched[key || id];
      delete newWatched[id];
      return newWatched;
    });
  }, []);

  const watchlistIds = useMemo(() => {
    return new Set(watchlist.map(item => item.id));
  }, [watchlist]);

  const watchlistKeys = useMemo(() => {
    return new Set(watchlist.map(item => getMediaKey(item)));
  }, [watchlist]);

  const watchedKeys = useMemo(() => {
    return new Set(Object.keys(watched));
  }, [watched]);

  const isInWatchlist = useCallback(
    (id, mediaType) => {
      if (mediaType) return watchlistKeys.has(getMediaKey(id, mediaType));
      return watchlistIds.has(id);
    },
    [watchlistIds, watchlistKeys]
  );

  const toggleWatchlist = useCallback(
    item => {
      const mediaType = item.media_type || 'movie';
      if (isInWatchlist(item.id, mediaType)) {
        removeFromWatchlist(item.id, mediaType);
      } else {
        addToWatchlist(item);
      }
    },
    [isInWatchlist, addToWatchlist, removeFromWatchlist]
  );

  // Notes management
  const getNote = useCallback(
    (movieId, mediaType) => {
      return notes[getMediaKey(movieId, mediaType)] || notes[movieId] || '';
    },
    [notes]
  );

  const setNote = useCallback((movieId, note, mediaType) => {
    setNotes(prev => ({
      ...prev,
      [getMediaKey(movieId, mediaType)]: note,
    }));
  }, []);

  // Watched management
  const isWatched = useCallback(
    (movieId, mediaType) => {
      if (mediaType) return !!watched[getMediaKey(movieId, mediaType)] || !!watched[movieId];
      return !!watched[movieId];
    },
    [watched]
  );

  const toggleWatched = useCallback((movieId, mediaType) => {
    const key = getMediaKey(movieId, mediaType);
    setWatched(prev => {
      if (prev[key] || (!mediaType && prev[movieId])) {
        const newWatched = { ...prev };
        delete newWatched[key];
        if (!mediaType) delete newWatched[movieId];
        return newWatched;
      } else {
        return { ...prev, [key]: Date.now() };
      }
    });
  }, []);

  const getWatchedCount = useCallback(() => {
    return Object.keys(watched).length;
  }, [watched]);

  // Random movie
  const getRandomMovie = useCallback(() => {
    if (watchlist.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * watchlist.length);
    return watchlist[randomIndex];
  }, [watchlist]);

  // Genre breakdown
  const getGenreBreakdown = useCallback(() => {
    const genreCounts = {};
    watchlist.forEach(item => {
      (item.genre_ids || []).forEach(genreId => {
        genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
      });
    });
    return genreCounts;
  }, [watchlist]);

  // Export to JSON
  const exportData = useCallback(() => {
    const data = {
      watchlist,
      notes,
      watched,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moodreel-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [watchlist, notes, watched]);

  // Import from JSON
  const importData = useCallback(jsonData => {
    try {
      const data = JSON.parse(jsonData);
      if (data.watchlist) setWatchlist(data.watchlist);
      if (data.notes) setNotes(data.notes);
      if (data.watched) setWatched(data.watched);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }, []);

  const [favorites, setFavorites] = useState(() => {
    return safeGetJSON(SK.FAVORITES_LEGACY, []);
  });

  // Persist favorites
  useEffect(() => {
    safeSetJSON(SK.FAVORITES_LEGACY, favorites);
  }, [favorites]);

  const addToFavorites = useCallback(item => {
    setFavorites(prev => {
      if (prev.some(i => i.id === item.id)) return prev;
      const newItem = {
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        media_type: item.media_type || 'movie',
        addedAt: Date.now(),
      };
      return [...prev, newItem];
    });
  }, []);

  const removeFromFavorites = useCallback(id => {
    setFavorites(prev => prev.filter(item => item.id !== id));
  }, []);

  const isFavorite = useCallback(
    id => {
      return favorites.some(item => item.id === id);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    item => {
      if (isFavorite(item.id)) {
        removeFromFavorites(item.id);
      } else {
        addToFavorites(item);
      }
    },
    [isFavorite, addToFavorites, removeFromFavorites]
  );

  return {
    watchlist,
    watchlistKeys,
    watchedKeys,
    favorites,
    addToWatchlist,
    removeFromWatchlist,
    addToFavorites,
    removeFromFavorites,
    isInWatchlist,
    isFavorite,
    toggleWatchlist,
    toggleFavorite,
    getNote,
    setNote,
    isWatched,
    toggleWatched,
    getWatchedCount,
    getRandomMovie,
    getGenreBreakdown,
    exportData,
    importData,
  };
}

export default useWatchlist;
