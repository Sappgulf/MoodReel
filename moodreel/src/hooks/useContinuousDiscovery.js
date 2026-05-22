import { useState, useCallback, useRef, useEffect } from 'react';
import searchService from '../services/searchService';
import { mediaKey } from '../utils/searchContext';
import { shouldSkipLog } from '../services/apiErrorUtils';

const SHUFFLE_INTERVAL_MS = 2000;
const EXPLORE_INTERVAL_MS = 4500;

/**
 * Continuous shuffle (Surprise) and auto-explore (search) until the user stops.
 */
export function useContinuousDiscovery({ getSearchParams, onShufflePick, trackSurprise }) {
  const [isShuffling, setIsShuffling] = useState(false);
  const [shufflePick, setShufflePick] = useState(null);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [isExploring, setIsExploring] = useState(false);

  const shuffleSessionRef = useRef(0);
  const shuffleTimerRef = useRef(null);
  const shuffleInFlightRef = useRef(false);
  const seenShuffleKeysRef = useRef(new Set());

  const exploreTimerRef = useRef(null);
  const exploreSessionRef = useRef(0);

  const clearShuffleTimer = useCallback(() => {
    if (shuffleTimerRef.current) {
      clearInterval(shuffleTimerRef.current);
      shuffleTimerRef.current = null;
    }
  }, []);

  const clearExploreTimer = useCallback(() => {
    if (exploreTimerRef.current) {
      clearInterval(exploreTimerRef.current);
      exploreTimerRef.current = null;
    }
  }, []);

  const fetchNextShufflePick = useCallback(
    async sessionId => {
      if (sessionId !== shuffleSessionRef.current || shuffleInFlightRef.current) return;
      shuffleInFlightRef.current = true;
      try {
        const params = getSearchParams();
        const pick = await searchService.fetchRandomDiscovery(params, {
          excludeKeys: seenShuffleKeysRef.current,
        });
        if (sessionId !== shuffleSessionRef.current) return;
        if (pick) {
          const key = mediaKey(pick);
          seenShuffleKeysRef.current.add(key);
          setShufflePick(pick);
          setShuffleCount(c => c + 1);
          onShufflePick?.(pick);
        }
      } catch (err) {
        if (!shouldSkipLog(err)) {
          // eslint-disable-next-line no-console
          console.error('Continuous shuffle pick failed:', err);
        }
      } finally {
        shuffleInFlightRef.current = false;
      }
    },
    [getSearchParams, onShufflePick, trackSurprise]
  );

  const stopShuffle = useCallback(() => {
    shuffleSessionRef.current += 1;
    clearShuffleTimer();
    shuffleInFlightRef.current = false;
    setIsShuffling(false);
  }, [clearShuffleTimer]);

  const startShuffle = useCallback(() => {
    shuffleSessionRef.current += 1;
    const sessionId = shuffleSessionRef.current;
    clearShuffleTimer();
    seenShuffleKeysRef.current = new Set();
    setShufflePick(null);
    setShuffleCount(0);
    setIsShuffling(true);
    trackSurprise?.();

    fetchNextShufflePick(sessionId);
    shuffleTimerRef.current = setInterval(() => {
      fetchNextShufflePick(sessionId);
    }, SHUFFLE_INTERVAL_MS);
  }, [clearShuffleTimer, fetchNextShufflePick]);

  const shuffleAgain = useCallback(() => {
    if (!isShuffling) {
      startShuffle();
      return;
    }
    fetchNextShufflePick(shuffleSessionRef.current);
  }, [isShuffling, startShuffle, fetchNextShufflePick]);

  const stopExplore = useCallback(() => {
    exploreSessionRef.current += 1;
    clearExploreTimer();
    setIsExploring(false);
  }, [clearExploreTimer]);

  const startExplore = useCallback(
    ({ loadMore, hasMore, canLoad }) => {
      exploreSessionRef.current += 1;
      const sessionId = exploreSessionRef.current;
      clearExploreTimer();
      setIsExploring(true);

      const tick = () => {
        if (sessionId !== exploreSessionRef.current) return;
        if (!canLoad?.()) {
          stopExplore();
          return;
        }
        if (hasMore?.()) {
          loadMore?.();
        }
      };

      tick();
      exploreTimerRef.current = setInterval(tick, EXPLORE_INTERVAL_MS);
    },
    [clearExploreTimer, stopExplore]
  );

  useEffect(() => {
    return () => {
      clearShuffleTimer();
      clearExploreTimer();
      shuffleSessionRef.current += 1;
      exploreSessionRef.current += 1;
    };
  }, [clearShuffleTimer, clearExploreTimer]);

  return {
    isShuffling,
    shufflePick,
    shuffleCount,
    startShuffle,
    stopShuffle,
    shuffleAgain,
    isExploring,
    startExplore,
    stopExplore,
  };
}

export default useContinuousDiscovery;
