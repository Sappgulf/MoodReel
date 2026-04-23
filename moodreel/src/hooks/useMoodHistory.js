import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'moodreel-mood-history';
const DATED_STORAGE_KEY = 'moodreel-mood-history-dated';
const MAX_HISTORY = 10;
const MAX_DATED_HISTORY = 100;
const HAS_STORAGE = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function readStorage(key, fallback) {
  if (!HAS_STORAGE) return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Custom hook for tracking mood search history
 * Persists last 10 searches to localStorage
 * Also stores timestamped history for calendar
 */
export function useMoodHistory() {
  const [history, setHistory] = useState(() => readStorage(STORAGE_KEY, []));
  const [historyWithDates, setHistoryWithDates] = useState(() =>
    readStorage(DATED_STORAGE_KEY, [])
  );
  const pendingAddRef = useRef(null);

  // Persist to localStorage outside render phase
  useEffect(() => {
    if (!HAS_STORAGE) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore quota errors
    }
  }, [history]);

  useEffect(() => {
    if (!HAS_STORAGE) return;
    try {
      localStorage.setItem(DATED_STORAGE_KEY, JSON.stringify(historyWithDates));
    } catch {
      // ignore quota errors
    }
  }, [historyWithDates]);

  const addToHistory = useCallback(mood => {
    if (!mood || mood.trim() === '') return;

    const trimmed = mood.trim().toLowerCase();
    const now = new Date().toISOString();

    // Update simple history (for chips)
    setHistory(prev => {
      const filtered = prev.filter(m => m !== trimmed);
      return [trimmed, ...filtered].slice(0, MAX_HISTORY);
    });

    // Update dated history (for calendar)
    setHistoryWithDates(prev => {
      const newEntry = { mood: trimmed, date: now };
      return [newEntry, ...prev].slice(0, MAX_DATED_HISTORY);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryWithDates([]);
    if (HAS_STORAGE) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DATED_STORAGE_KEY);
    }
  }, []);

  return { history, historyWithDates, addToHistory, clearHistory };
}

export default useMoodHistory;
