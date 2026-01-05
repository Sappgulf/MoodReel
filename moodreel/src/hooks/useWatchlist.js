import { useState, useEffect, useCallback } from 'react';

const WATCHLIST_KEY = 'moodreel_watchlist';
const NOTES_KEY = 'moodreel_notes';

/**
 * Custom hook for managing watchlist with localStorage persistence
 * Includes notes per movie and genre tracking
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

    // Persist watchlist to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
        } catch (error) {
            console.error('Failed to save watchlist:', error);
        }
    }, [watchlist]);

    // Persist notes to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
        } catch (error) {
            console.error('Failed to save notes:', error);
        }
    }, [notes]);

    const addToWatchlist = useCallback((item) => {
        setWatchlist((prev) => {
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
                genre_ids: item.genre_ids || [],
                addedAt: Date.now(),
            }];
        });
    }, []);

    const removeFromWatchlist = useCallback((id) => {
        setWatchlist((prev) => prev.filter((item) => item.id !== id));
        // Also remove notes for this item
        setNotes(prev => {
            const newNotes = { ...prev };
            delete newNotes[id];
            return newNotes;
        });
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

    // Notes management
    const getNote = useCallback((movieId) => {
        return notes[movieId] || '';
    }, [notes]);

    const setNote = useCallback((movieId, note) => {
        setNotes(prev => ({
            ...prev,
            [movieId]: note
        }));
    }, []);

    // Get random movie from watchlist
    const getRandomMovie = useCallback(() => {
        if (watchlist.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * watchlist.length);
        return watchlist[randomIndex];
    }, [watchlist]);

    // Get genre breakdown for stats
    const getGenreBreakdown = useCallback(() => {
        const genreCounts = {};
        watchlist.forEach(item => {
            (item.genre_ids || []).forEach(genreId => {
                genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
            });
        });
        return genreCounts;
    }, [watchlist]);

    return {
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        toggleWatchlist,
        getNote,
        setNote,
        getRandomMovie,
        getGenreBreakdown,
    };
}

export default useWatchlist;
