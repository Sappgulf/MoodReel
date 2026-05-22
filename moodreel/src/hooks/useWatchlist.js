import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMediaKey, getMediaType, normalizeMediaKey } from '../utils/mediaKeys';

const WATCHLIST_KEY = 'moodreel_watchlist';
const NOTES_KEY = 'moodreel_notes';
const WATCHED_KEY = 'moodreel_watched';
const FAVORITES_KEY = 'moodreel_favorites';

const toLegacyId = key => key.split(':')[1];

const migrateKeyedObject = (source, watchlistItems) => {
  const migrated = { ...(source || {}) };
  for (const item of watchlistItems) {
    const key = getMediaKey(item);
    const legacyKey = String(item.id);
    if (migrated[key] !== undefined || migrated[legacyKey] === undefined) continue;
    migrated[key] = migrated[legacyKey];
    delete migrated[legacyKey];
  }
  return migrated;
};

const migrateItems = items =>
  (Array.isArray(items) ? items : []).map(item => ({ ...item, media_type: getMediaType(item) }));

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_KEY);
      return migrateItems(saved ? JSON.parse(saved) : []);
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

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return migrateItems(saved ? JSON.parse(saved) : []);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setNotes(prev => migrateKeyedObject(prev, watchlist));
    setWatched(prev => migrateKeyedObject(prev, watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(WATCHED_KEY, JSON.stringify(watched));
  }, [watched]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addToWatchlist = useCallback(item => {
    const next = { ...item, media_type: getMediaType(item), addedAt: Date.now() };
    const mediaKey = getMediaKey(next);
    let added = null;
    setWatchlist(prev => {
      if (prev.some(i => getMediaKey(i) === mediaKey)) return prev;
      added = {
        id: next.id,
        title: next.title || next.name,
        poster_path: next.poster_path,
        vote_average: next.vote_average,
        release_date: next.release_date || next.first_air_date,
        media_type: next.media_type,
        genre_ids: next.genre_ids || [],
        addedAt: next.addedAt,
      };
      return [...prev, added];
    });
    return added;
  }, []);

  const removeFromWatchlist = useCallback((id, mediaType = 'movie') => {
    const key = `${mediaType}:${id}`;
    setWatchlist(prev => prev.filter(item => getMediaKey(item) !== key));
    setNotes(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setWatched(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  }, []);

  const watchlistIds = useMemo(
    () => new Set(watchlist.map(item => getMediaKey(item))),
    [watchlist]
  );

  const isInWatchlist = useCallback(
    (id, mediaType = 'movie') => watchlistIds.has(`${mediaType}:${id}`),
    [watchlistIds]
  );

  const toggleWatchlist = useCallback(
    item => {
      const mediaType = getMediaType(item);
      if (isInWatchlist(item.id, mediaType)) removeFromWatchlist(item.id, mediaType);
      else addToWatchlist(item);
    },
    [isInWatchlist, removeFromWatchlist, addToWatchlist]
  );

  const getNote = useCallback(
    (id, mediaType = 'movie') => notes[`${mediaType}:${id}`] || notes[String(id)] || '',
    [notes]
  );
  const setNote = useCallback(
    (id, note, mediaType = 'movie') =>
      setNotes(prev => ({ ...prev, [`${mediaType}:${id}`]: note })),
    []
  );

  const isWatched = useCallback(
    (id, mediaType = 'movie') => !!(watched[`${mediaType}:${id}`] || watched[String(id)]),
    [watched]
  );
  const toggleWatched = useCallback((id, mediaType = 'movie') => {
    const key = `${mediaType}:${id}`;
    setWatched(prev => {
      if (prev[key]) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: Date.now() };
    });
  }, []);

  const getWatchedCount = useCallback(() => Object.keys(watched).length, [watched]);
  const getRandomMovie = useCallback(
    () => (watchlist.length ? watchlist[Math.floor(Math.random() * watchlist.length)] : null),
    [watchlist]
  );
  const getGenreBreakdown = useCallback(() => {
    const counts = {};
    watchlist.forEach(item =>
      (item.genre_ids || []).forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      })
    );
    return counts;
  }, [watchlist]);

  const exportData = useCallback(() => {
    const data = { watchlist, notes, watched, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moodreel-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [watchlist, notes, watched]);

  const importData = useCallback(jsonData => {
    try {
      const data = JSON.parse(jsonData);
      if (data.watchlist) setWatchlist(migrateItems(data.watchlist));
      if (data.notes) setNotes(data.notes);
      if (data.watched) setWatched(data.watched);
      return true;
    } catch {
      return false;
    }
  }, []);

  const addToFavorites = useCallback(item => {
    const normalized = { ...item, media_type: getMediaType(item) };
    setFavorites(prev => {
      if (prev.some(i => getMediaKey(i) === getMediaKey(normalized))) return prev;
      return [
        ...prev,
        {
          id: normalized.id,
          title: normalized.title || normalized.name,
          poster_path: normalized.poster_path,
          vote_average: normalized.vote_average,
          release_date: normalized.release_date || normalized.first_air_date,
          media_type: normalized.media_type,
          addedAt: Date.now(),
        },
      ];
    });
  }, []);

  const removeFromFavorites = useCallback((id, mediaType = 'movie') => {
    const key = `${mediaType}:${id}`;
    setFavorites(prev => prev.filter(item => getMediaKey(item) !== key));
  }, []);

  const isFavorite = useCallback(
    (id, mediaType = 'movie') => favorites.some(item => getMediaKey(item) === `${mediaType}:${id}`),
    [favorites]
  );

  const toggleFavorite = useCallback(
    item => {
      const mediaType = getMediaType(item);
      if (isFavorite(item.id, mediaType)) removeFromFavorites(item.id, mediaType);
      else addToFavorites(item);
    },
    [isFavorite, removeFromFavorites, addToFavorites]
  );

  const watchedKeys = useMemo(
    () => new Set(Object.keys(watched).map(normalizeMediaKey).filter(Boolean)),
    [watched]
  );

  return {
    watchlist,
    watched,
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
