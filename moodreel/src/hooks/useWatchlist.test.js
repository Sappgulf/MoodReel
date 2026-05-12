import { renderHook, act } from '@testing-library/react';
import { describe, beforeEach, it, expect } from 'vitest';
import { StorageKeys } from '../storage/storageKeys';
import { useWatchlist } from './useWatchlist';

beforeEach(() => {
  localStorage.getItem.mockImplementation(() => null);
  localStorage.setItem.mockClear();
});

describe('useWatchlist', () => {
  const mockMovie = {
    id: 123,
    title: 'Test Movie',
    poster_path: '/test.jpg',
    vote_average: 8.5,
    release_date: '2024-01-01',
    media_type: 'movie',
    genre_ids: [28, 12],
  };

  describe('addToWatchlist', () => {
    it('should add a movie to the watchlist', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.addToWatchlist(mockMovie);
      });

      expect(result.current.watchlist).toHaveLength(1);
      expect(result.current.watchlist[0].id).toBe(123);
      expect(result.current.watchlist[0].title).toBe('Test Movie');
    });

    it('should not add duplicate movies', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.addToWatchlist(mockMovie);
        result.current.addToWatchlist(mockMovie);
      });

      expect(result.current.watchlist).toHaveLength(1);
    });

    it('allows same TMDB id when media type differs', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.addToWatchlist(mockMovie);
        result.current.addToWatchlist({
          ...mockMovie,
          title: 'Test Show',
          media_type: 'tv',
        });
      });

      expect(result.current.watchlist).toHaveLength(2);
      expect(result.current.isInWatchlist(123, 'movie')).toBe(true);
      expect(result.current.isInWatchlist(123, 'tv')).toBe(true);
    });

    it('should add timestamp to movie', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.addToWatchlist(mockMovie);
      });

      expect(result.current.watchlist[0].addedAt).toBeDefined();
      expect(typeof result.current.watchlist[0].addedAt).toBe('number');
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove a movie from the watchlist', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.addToWatchlist(mockMovie);
      });
      expect(result.current.watchlist).toHaveLength(1);

      act(() => {
        result.current.removeFromWatchlist(123);
      });
      expect(result.current.watchlist).toHaveLength(0);
    });
  });

  describe('isInWatchlist', () => {
    it('should return true for movies in watchlist', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.addToWatchlist(mockMovie);
      });

      expect(result.current.isInWatchlist(123)).toBe(true);
      expect(result.current.isInWatchlist(999)).toBe(false);
    });
  });

  describe('toggleWatchlist', () => {
    it('should add movie if not in watchlist', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.toggleWatchlist(mockMovie);
      });

      expect(result.current.isInWatchlist(123)).toBe(true);
    });

    it('should remove movie if already in watchlist', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.toggleWatchlist(mockMovie);
      });

      expect(result.current.isInWatchlist(123)).toBe(true);

      act(() => {
        result.current.toggleWatchlist(mockMovie);
      });

      expect(result.current.isInWatchlist(123)).toBe(false);
    });
  });

  describe('watched status', () => {
    it('should track watched movies', () => {
      const { result } = renderHook(() => useWatchlist());

      expect(result.current.isWatched(123)).toBe(false);

      act(() => {
        result.current.toggleWatched(123);
      });

      expect(result.current.isWatched(123)).toBe(true);
    });

    it('should toggle watched status off', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.toggleWatched(123);
        result.current.toggleWatched(123);
      });

      expect(result.current.isWatched(123)).toBe(false);
    });

    it('should count watched movies', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.toggleWatched(1);
        result.current.toggleWatched(2);
        result.current.toggleWatched(3);
      });

      expect(result.current.getWatchedCount()).toBe(3);
    });

    it('tracks watched status by media type when provided', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.toggleWatched(123, 'tv');
      });

      expect(result.current.isWatched(123, 'tv')).toBe(true);
      expect(result.current.isWatched(123, 'movie')).toBe(false);
    });
  });

  describe('notes', () => {
    it('should set and get notes for movies', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.setNote(123, 'Great movie!');
      });

      expect(result.current.getNote(123)).toBe('Great movie!');
    });

    it('should return empty string for movies without notes', () => {
      const { result } = renderHook(() => useWatchlist());

      expect(result.current.getNote(999)).toBe('');
    });
  });

  describe('random movie', () => {
    it('should return null for empty watchlist', () => {
      const { result } = renderHook(() => useWatchlist());

      expect(result.current.getRandomMovie()).toBeNull();
    });

    it('should return a movie from watchlist', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.addToWatchlist(mockMovie);
      });

      const random = result.current.getRandomMovie();
      expect(random).toBeDefined();
      expect(random.id).toBe(123);
    });
  });

  describe('persistence', () => {
    it('should persist watchlist to localStorage', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.addToWatchlist(mockMovie);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(StorageKeys.WATCHLIST, expect.any(String));
    });
  });
});
