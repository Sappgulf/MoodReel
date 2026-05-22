import { useState, useEffect, useCallback } from 'react';

const HISTORY_KEY = 'moodreel-watch-history';
const MAX_HISTORY = 100;

/**
 * Hook to track movies the user has viewed/clicked
 */
export function useWatchHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Add a movie to history
  const addToHistory = useCallback((movie, credits) => {
    const entry = {
      id: movie.id,
      title: movie.title || movie.name,
      poster_path: movie.poster_path,
      media_type: movie.media_type || 'movie',
      viewedAt: Date.now(),
      cast: credits?.cast?.slice(0, 5).map(c => c.name) || [],
      directors: credits?.crew?.filter(c => c.job === 'Director').map(c => c.name) || [],
    };

    setHistory(prev => {
      // Remove if already exists (to push to front)
      const filtered = prev.filter(h => h.id !== movie.id);
      // Add to front, limit to max
      return [entry, ...filtered].slice(0, MAX_HISTORY);
    });
  }, []);

  // Get history grouped by date
  const getHistoryByDate = useCallback(() => {
    const groups = {};
    history.forEach(item => {
      const date = new Date(item.viewedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    return groups;
  }, [history]);

  // Get stats
  const getStats = useCallback(() => {
    const now = new Date();
    const thisMonth = history.filter(h => {
      const viewDate = new Date(h.viewedAt);
      return viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear();
    });

    const thisWeek = history.filter(h => {
      const viewDate = new Date(h.viewedAt);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return viewDate >= weekAgo;
    });

    return {
      total: history.length,
      thisMonth: thisMonth.length,
      thisWeek: thisWeek.length,
    };
  }, [history]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addToHistory,
    getHistoryByDate,
    getStats,
    clearHistory,
  };
}

export default useWatchHistory;
