import { renderHook, act } from '@testing-library/react';
import { useWatchlist } from './useWatchlist';

beforeEach(() => {
  localStorage.getItem.mockImplementation(() => null);
  localStorage.setItem.mockClear();
});

describe('useWatchlist media identity', () => {
  const movie = { id: 123, title: 'Movie', media_type: 'movie' };
  const show = { id: 123, name: 'Show', media_type: 'tv' };

  it('supports movie and tv with same numeric ID', () => {
    const { result } = renderHook(() => useWatchlist());
    act(() => {
      result.current.addToWatchlist(movie);
      result.current.addToWatchlist(show);
    });
    expect(result.current.watchlist).toHaveLength(2);
    expect(result.current.isInWatchlist(123, 'movie')).toBe(true);
    expect(result.current.isInWatchlist(123, 'tv')).toBe(true);
  });

  it('removing one media type does not remove the other', () => {
    const { result } = renderHook(() => useWatchlist());
    act(() => {
      result.current.addToWatchlist(movie);
      result.current.addToWatchlist(show);
      result.current.removeFromWatchlist(123, 'movie');
    });
    expect(result.current.isInWatchlist(123, 'movie')).toBe(false);
    expect(result.current.isInWatchlist(123, 'tv')).toBe(true);
  });

  it('notes and watched do not collide by media type', () => {
    const { result } = renderHook(() => useWatchlist());
    act(() => {
      result.current.setNote(123, 'movie note', 'movie');
      result.current.setNote(123, 'tv note', 'tv');
      result.current.toggleWatched(123, 'movie');
    });
    expect(result.current.getNote(123, 'movie')).toBe('movie note');
    expect(result.current.getNote(123, 'tv')).toBe('tv note');
    expect(result.current.isWatched(123, 'movie')).toBe(true);
    expect(result.current.isWatched(123, 'tv')).toBe(false);
  });

  it('imports data and keeps media type checks valid', () => {
    const { result } = renderHook(() => useWatchlist());
    const payload = JSON.stringify({
      watchlist: [movie, show],
      notes: { 'movie:123': 'ok' },
      watched: { 'tv:123': 1 },
    });
    act(() => {
      expect(result.current.importData(payload)).toBe(true);
    });
    expect(result.current.isInWatchlist(123, 'movie')).toBe(true);
    expect(result.current.isInWatchlist(123, 'tv')).toBe(true);
    expect(result.current.getNote(123, 'movie')).toBe('ok');
    expect(result.current.isWatched(123, 'tv')).toBe(true);
  });
});
