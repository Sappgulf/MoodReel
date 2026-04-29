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
  });

  it('clears loading when discovery returns null', async () => {
    searchService.fetchRandomDiscovery.mockResolvedValue(null);
    const { result } = renderHook(() => useSurpriseShuffle({ playSound: vi.fn() }));
    await act(async () => {
      await result.current.handleSurpriseMe();
    });
    await waitFor(() => expect(result.current.isSurpriseLoading).toBe(false));
  });
});
