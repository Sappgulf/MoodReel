import { useState, useCallback } from 'react';

const STORAGE_KEY = 'moodreel-mood-history';
const DATED_STORAGE_KEY = 'moodreel-mood-history-dated';
const MAX_HISTORY = 10;
const MAX_DATED_HISTORY = 100;

/**
 * Custom hook for tracking mood search history
 * Persists last 10 searches to localStorage
 * Also stores timestamped history for calendar
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

    const [historyWithDates, setHistoryWithDates] = useState(() => {
        try {
            const saved = localStorage.getItem(DATED_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const addToHistory = useCallback((mood) => {
        if (!mood || mood.trim() === '') return;

        const trimmed = mood.trim().toLowerCase();
        const now = new Date().toISOString();

        // Update simple history (for chips)
        setHistory(prev => {
            const filtered = prev.filter(m => m !== trimmed);
            const newHistory = [trimmed, ...filtered].slice(0, MAX_HISTORY);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
            return newHistory;
        });

        // Update dated history (for calendar)
        setHistoryWithDates(prev => {
            const newEntry = { mood: trimmed, date: now };
            const newDatedHistory = [newEntry, ...prev].slice(0, MAX_DATED_HISTORY);
            localStorage.setItem(DATED_STORAGE_KEY, JSON.stringify(newDatedHistory));
            return newDatedHistory;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        setHistoryWithDates([]);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(DATED_STORAGE_KEY);
    }, []);

    return { history, historyWithDates, addToHistory, clearHistory };
}

export default useMoodHistory;
