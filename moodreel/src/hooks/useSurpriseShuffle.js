import { useState, useCallback, useEffect, useRef } from 'react';
import searchService from '../services/searchService';

/**
 * Surprise Me overlay flow: shuffle animation → random TMDB pick → banner reveal.
 */
export function useSurpriseShuffle({ playSound }) {
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);
  const [showWinnerInfo, setShowWinnerInfo] = useState(false);
  const [surpriseMovie, setSurpriseMovie] = useState(null);
  const surpriseSessionRef = useRef(0);
  const surpriseRevealTimerRef = useRef(null);

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

  const handleSurpriseMe = useCallback(async () => {
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
      const randomPick = await searchService.fetchRandomDiscovery();
      if (sessionId !== surpriseSessionRef.current) return;
      if (randomPick) {
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
  }, [isSurpriseLoading, playSound]);

  return {
    isSurpriseLoading,
    showWinnerInfo,
    surpriseMovie,
    closeSurprise,
    handleSurpriseMe,
  };
}
