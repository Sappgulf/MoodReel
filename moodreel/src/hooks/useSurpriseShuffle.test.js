import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../services/searchService', () => ({
  __esModule: true,
  default: {
    fetchRandomDiscovery: vi.fn(),
  },
}));

import searchService from '../services/searchService';
import { useSurpriseShuffle } from './useSurpriseShuffle';

describe('useSurpriseShuffle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const store = new Map();
    window.localStorage.getItem.mockImplementation(key => store.get(key) ?? null);
    window.localStorage.setItem.mockImplementation((key, value) => {
      store.set(key, String(value));
    });
    window.localStorage.removeItem.mockImplementation(key => {
      store.delete(key);
    });
    window.localStorage.clear.mockImplementation(() => {
      store.clear();
    });
  });

  it('clears loading when discovery returns null', async () => {
    searchService.fetchRandomDiscovery.mockResolvedValue(null);
    const { result } = renderHook(() => useSurpriseShuffle({ playSound: vi.fn() }));
    await act(async () => {
      await result.current.handleSurpriseMe();
    });
    await waitFor(() => expect(result.current.isSurpriseLoading).toBe(false));
  });

  it('prefers unseen local candidates before calling random discovery', async () => {
    const playSound = vi.fn();
    const { result } = renderHook(() => useSurpriseShuffle({ playSound }));
    const candidate = { id: 42, title: 'Local Pick', media_type: 'movie' };

    await act(async () => {
      await result.current.handleSurpriseMe({
        candidates: [candidate],
        avoidKeys: [],
      });
    });

    await waitFor(() => expect(result.current.surpriseMovie).toEqual(candidate));
    expect(searchService.fetchRandomDiscovery).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('moodreel-surprise-seen')).toContain('42-movie');
  });
});
