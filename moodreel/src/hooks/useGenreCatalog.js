import { useEffect, useState } from 'react';
import searchService from '../services/searchService';
import { shouldSkipLog } from '../services/apiErrorUtils';

/**
 * TMDB's genre list for the active content type. Returns an empty list until
 * it loads, and on failure, so callers never have to null-check.
 */
export function useGenreCatalog(contentType) {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchGenres = async () => {
      try {
        const endpoint = contentType === 'tv' ? 'tv' : 'movie';
        const data = await searchService.fetchGenres(endpoint, controller.signal);
        setGenres(data);
      } catch (err) {
        if (!shouldSkipLog(err)) {
          console.error('Error fetching genres:', err);
        }
      }
    };

    fetchGenres();
    return () => controller.abort();
  }, [contentType]);

  return genres;
}

export default useGenreCatalog;
