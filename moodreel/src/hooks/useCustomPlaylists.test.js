import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCustomPlaylists } from './useCustomPlaylists';

describe('useCustomPlaylists', () => {
  it('can update and reorder saved vibes', () => {
    const { result } = renderHook(() => useCustomPlaylists());

    act(() => {
      result.current.savePlaylist('One', { mood: 'cozy' });
      result.current.savePlaylist('Two', { mood: 'thriller' });
    });

    act(() => {
      result.current.updatePlaylist(result.current.playlists[0].id, { name: 'Renamed' });
    });

    expect(result.current.playlists[0].name).toBe('Renamed');

    act(() => {
      result.current.movePlaylist(result.current.playlists[1].id, 'up');
    });

    expect(result.current.playlists[0].name).toBe('Two');
    expect(result.current.playlists[1].name).toBe('Renamed');
  });
});
