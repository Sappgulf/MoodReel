import { describe, it, expect } from 'vitest';
import {
  getMediaKey,
  normalizeMediaKey,
  migrateTasteProfile,
  buildScoringContext,
} from './mediaKeys';

describe('mediaKeys', () => {
  it('builds canonical keys', () => {
    expect(getMediaKey({ id: 42, media_type: 'tv' })).toBe('tv:42');
    expect(getMediaKey(7, 'movie')).toBe('movie:7');
  });

  it('migrates legacy taste keys', () => {
    expect(normalizeMediaKey('99-movie')).toBe('movie:99');
    expect(migrateTasteProfile({ liked: ['12-tv'], disliked: [] })).toEqual({
      liked: ['tv:12'],
      disliked: [],
    });
  });

  it('builds scoring context sets', () => {
    const ctx = buildScoringContext({
      profile: { liked: ['1-movie'], disliked: [] },
      watchlist: [{ id: 2, media_type: 'movie' }],
      availableMinutes: 120,
    });
    expect(ctx.likedKeys.has('movie:1')).toBe(true);
    expect(ctx.watchlistKeys.has('movie:2')).toBe(true);
    expect(ctx.availableMinutes).toBe(120);
  });
});
