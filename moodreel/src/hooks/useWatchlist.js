import { useState, useEffect, useCallback, useMemo } from 'react';

const WATCHLIST_KEY = 'moodreel_watchlist';
const NOTES_KEY = 'moodreel_notes';
const WATCHED_KEY = 'moodreel_watched';

/**
 * Custom hook for managing watchlist with localStorage persistence
 * Includes notes, watched status, and genre tracking
 */
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [watched, setWatched] = useState(() => {
    try {
      const saved = localStorage.getItem(WATCHED_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist watchlist
  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch (error) {
      console.error('Failed to save watchlist:', error);
    }
  }, [watchlist]);

  // Persist notes
  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  }, [notes]);

  // Persist watched
  useEffect(() => {
    try {
      localStorage.setItem(WATCHED_KEY, JSON.stringify(watched));
    } catch (error) {
      console.error('Failed to save watched:', error);
    }
  }, [watched]);

  const addToWatchlist = useCallback(item => {
    let added = null;
    setWatchlist(prev => {
      // Check if already exists inside the updater to avoid stale closure
      const existing = prev.some(i => i.id === item.id);
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

  const removeFromWatchlist = useCallback(id => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
    setNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[id];
      return newNotes;
    });
    setWatched(prev => {
      const newWatched = { ...prev };
      delete newWatched[id];
      return newWatched;
    });
  }, []);

  const watchlistIds = useMemo(() => {
    return new Set(watchlist.map(item => item.id));
  }, [watchlist]);

  const isInWatchlist = useCallback(
    id => {
      return watchlistIds.has(id);
    },
    [watchlistIds]
  );

  const toggleWatchlist = useCallback(
    item => {
      if (isInWatchlist(item.id)) {
        removeFromWatchlist(item.id);
      } else {
        addToWatchlist(item);
      }
    },
    [isInWatchlist, addToWatchlist, removeFromWatchlist]
  );

  // Notes management
  const getNote = useCallback(
    movieId => {
      return notes[movieId] || '';
    },
    [notes]
  );

  const setNote = useCallback((movieId, note) => {
    setNotes(prev => ({
      ...prev,
      [movieId]: note,
    }));
  }, []);

  // Watched management
  const isWatched = useCallback(
    movieId => {
      return !!watched[movieId];
    },
    [watched]
  );

  const toggleWatched = useCallback(movieId => {
    setWatched(prev => {
      if (prev[movieId]) {
        const newWatched = { ...prev };
        delete newWatched[movieId];
        return newWatched;
      } else {
        return { ...prev, [movieId]: Date.now() };
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
    try {
      const saved = localStorage.getItem('moodreel_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem('moodreel_favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
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
