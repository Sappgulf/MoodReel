import { useState, useCallback, useEffect, useRef } from 'react';
import searchService from '../services/searchService';
import { safeGetJSON, safeSetJSON } from '../storage/safeStorage';
import { StorageKeys as SK } from '../storage/storageKeys';

/**
 * Surprise Me overlay flow: shuffle animation → random TMDB pick → banner reveal.
 */
export function useSurpriseShuffle({ playSound }) {
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);
  const [showWinnerInfo, setShowWinnerInfo] = useState(false);
  const [surpriseMovie, setSurpriseMovie] = useState(null);
  const surpriseSessionRef = useRef(0);
  const surpriseRevealTimerRef = useRef(null);

  const rememberSurprise = useCallback(item => {
    if (!item?.id) return;
    const key = `${item.id}-${item.media_type || 'movie'}`;
    const seen = safeGetJSON(SK.SURPRISE_SEEN, []);
    safeSetJSON(SK.SURPRISE_SEEN, [key, ...seen.filter(id => id !== key)].slice(0, 80));
  }, []);

  const pickCandidate = useCallback(options => {
    const candidates = options.candidates || [];
    const seen = new Set(safeGetJSON(SK.SURPRISE_SEEN, []));
    const avoid = new Set(options.avoidKeys || []);
    const eligible = candidates.filter(item => {
      const key = `${item.id}-${item.media_type || 'movie'}`;
      return !seen.has(key) && !avoid.has(key);
    });
    if (eligible.length === 0) return null;
    return eligible[Math.floor(Math.random() * eligible.length)];
  }, []);

  useEffect(() => {
    return () => {
      if (surpriseRevealTimerRef.current) {
        clearTimeout(surpriseRevealTimerRef.current);
      }
    };
  }, []);

  const closeSurprise = useCallback(() => {
    surpriseSessionRef.current += 1;
    if (surpriseRevealTimerRef.current) {
      clearTimeout(surpriseRevealTimerRef.current);
      surpriseRevealTimerRef.current = null;
    }
    setIsSurpriseLoading(false);
    setSurpriseMovie(null);
    setShowWinnerInfo(false);
  }, []);

  const handleSurpriseMe = useCallback(
    async (options = {}) => {
      if (isSurpriseLoading) return;
      playSound('click');
      if (navigator.vibrate) navigator.vibrate(20);
      surpriseSessionRef.current += 1;
      const sessionId = surpriseSessionRef.current;
      setSurpriseMovie(null);
      setShowWinnerInfo(false);
      setIsSurpriseLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (sessionId !== surpriseSessionRef.current) return;
      try {
        const localPick = pickCandidate(options);
        let randomPick = localPick;
        if (!randomPick) {
          const avoidKeys = new Set([
            ...safeGetJSON(SK.SURPRISE_SEEN, []),
            ...(options.avoidKeys || []),
          ]);
          for (let attempt = 0; attempt < 3; attempt += 1) {
            const candidate = await searchService.fetchRandomDiscovery(options.signal);
            const key = candidate ? `${candidate.id}-${candidate.media_type || 'movie'}` : '';
            if (candidate && !avoidKeys.has(key)) {
              randomPick = candidate;
              break;
            }
          }
        }
        if (sessionId !== surpriseSessionRef.current) return;
        if (randomPick) {
          rememberSurprise(randomPick);
          setSurpriseMovie(randomPick);
          if (surpriseRevealTimerRef.current) {
            clearTimeout(surpriseRevealTimerRef.current);
          }
          surpriseRevealTimerRef.current = setTimeout(() => {
            if (sessionId !== surpriseSessionRef.current) return;
            surpriseRevealTimerRef.current = null;
            setIsSurpriseLoading(false);
            setShowWinnerInfo(true);
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          }, 500);
        } else if (sessionId === surpriseSessionRef.current) {
          setIsSurpriseLoading(false);
        }
      } catch (err) {
        if (sessionId !== surpriseSessionRef.current) return;
        console.error('Surprise me failed:', err);
        setIsSurpriseLoading(false);
      }
    },
    [isSurpriseLoading, pickCandidate, playSound, rememberSurprise]
  );

  return {
    isSurpriseLoading,
    showWinnerInfo,
    surpriseMovie,
    closeSurprise,
    handleSurpriseMe,
  };
}
