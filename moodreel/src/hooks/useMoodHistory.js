import { useState, useCallback, useEffect } from 'react';

import { StorageKeys as SK } from '../storage/storageKeys';
import { safeGetJSON, safeSetJSON, safeRemove } from '../storage/safeStorage';

const STORAGE_KEY = SK.MOOD_HISTORY;
const DATED_STORAGE_KEY = SK.MOOD_HISTORY_DATED;
const MAX_HISTORY = 10;
const MAX_DATED_HISTORY = 100;
function readStorage(key, fallback) {
  return safeGetJSON(key, fallback);
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

  // Persist to localStorage outside render phase
  useEffect(() => {
    safeSetJSON(STORAGE_KEY, history);
  }, [history]);

  useEffect(() => {
    safeSetJSON(DATED_STORAGE_KEY, historyWithDates);
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
    safeRemove(STORAGE_KEY);
    safeRemove(DATED_STORAGE_KEY);
  }, []);

  return { history, historyWithDates, addToHistory, clearHistory };
}

export default useMoodHistory;
