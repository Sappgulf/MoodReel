import { useState, useCallback } from 'react';

const STORAGE_KEY = 'moodreel-mood-history';
const MAX_HISTORY = 10;

/**
 * Custom hook for tracking mood search history
 * Persists last 10 searches to localStorage
 */
export function useMoodHistory() {
    const [history, setHistory] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const addToHistory = useCallback((mood) => {
        if (!mood || mood.trim() === '') return;

        const trimmed = mood.trim().toLowerCase();
        setHistory(prev => {
            // Remove duplicate if exists
            const filtered = prev.filter(m => m !== trimmed);
            // Add to front, limit to MAX_HISTORY
            const newHistory = [trimmed, ...filtered].slice(0, MAX_HISTORY);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return { history, addToHistory, clearHistory };
}

export default useMoodHistory;
