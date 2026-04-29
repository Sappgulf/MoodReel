import { useState, useCallback } from 'react';

import { StorageKeys as SK } from '../storage/storageKeys';

const STORAGE_KEY = SK.RATINGS;

/**
 * Custom hook for user ratings and reviews
 * Persists to localStorage
 */
export function useRatings() {
  const [ratings, setRatings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveRatings = useCallback(newRatings => {
    setRatings(newRatings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRatings));
  }, []);

  const getRating = useCallback(
    movieId => {
      return ratings[movieId]?.rating || 0;
    },
    [ratings]
  );

  const setRating = useCallback(
    (movieId, rating) => {
      const newRatings = {
        ...ratings,
        [movieId]: { ...ratings[movieId], rating },
      };
      saveRatings(newRatings);
    },
    [ratings, saveRatings]
  );

  const getReview = useCallback(
    movieId => {
      return ratings[movieId]?.review || '';
    },
    [ratings]
  );

  const setReview = useCallback(
    (movieId, review) => {
      const newRatings = {
        ...ratings,
        [movieId]: { ...ratings[movieId], review },
      };
      saveRatings(newRatings);
    },
    [ratings, saveRatings]
  );

  return { getRating, setRating, getReview, setReview };
}

export default useRatings;
