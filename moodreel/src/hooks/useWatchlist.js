import { useState, useEffect, useCallback } from 'react';

const WATCHLIST_KEY = 'moodreel_watchlist';

/**
 * Custom hook for managing watchlist with localStorage persistence
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

    // Persist to localStorage whenever watchlist changes
    useEffect(() => {
        try {
            localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
        } catch (error) {
            console.error('Failed to save watchlist:', error);
        }
    }, [watchlist]);

    const addToWatchlist = useCallback((item) => {
        setWatchlist((prev) => {
            // Avoid duplicates
            if (prev.some((i) => i.id === item.id)) {
                return prev;
            }
            return [...prev, {
                id: item.id,
                title: item.title || item.name,
                poster_path: item.poster_path,
                vote_average: item.vote_average,
                release_date: item.release_date || item.first_air_date,
                media_type: item.media_type || 'movie',
                addedAt: Date.now(),
            }];
        });
    }, []);

    const removeFromWatchlist = useCallback((id) => {
        setWatchlist((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const isInWatchlist = useCallback((id) => {
        return watchlist.some((item) => item.id === id);
    }, [watchlist]);

    const toggleWatchlist = useCallback((item) => {
        if (isInWatchlist(item.id)) {
            removeFromWatchlist(item.id);
        } else {
            addToWatchlist(item);
        }
    }, [isInWatchlist, addToWatchlist, removeFromWatchlist]);

    return {
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        toggleWatchlist,
    };
}

export default useWatchlist;
