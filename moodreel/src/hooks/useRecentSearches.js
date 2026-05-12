import { useState, useEffect, useCallback } from 'react';

import { StorageKeys as SK } from '../storage/storageKeys';
import { safeGetJSON, safeSetJSON } from '../storage/safeStorage';

const RECENT_SEARCHES_KEY = SK.RECENT_SEARCHES;
const MAX_RECENT_SEARCHES = 10;

function readStoredJSON(key, fallback) {
  return safeGetJSON(key, fallback);
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState(() =>
    readStoredJSON(RECENT_SEARCHES_KEY, [])
  );

  useEffect(() => {
    safeSetJSON(RECENT_SEARCHES_KEY, recentSearches);
  }, [recentSearches]);

  const addRecentSearch = useCallback(search => {
    if (!search || search.trim().length < 2) return;

    setRecentSearches(prev => {
      const cleaned = search.trim();
      const filtered = prev.filter(s => s.toLowerCase() !== cleaned.toLowerCase());
      return [cleaned, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
}

export function useVoiceSearch() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = event => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
      }
    };

    recognition.onerror = event => {
      console.debug('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [isSupported]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
  };
}

export default useRecentSearches;
