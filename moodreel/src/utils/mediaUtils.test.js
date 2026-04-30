import { describe, expect, it } from 'vitest';
import { FALLBACK_BACKDROP, FALLBACK_POSTER, getBackdropUrl, getPosterUrl } from './mediaUtils';

describe('media image URL helpers', () => {
  it('builds TMDB image URLs from relative paths', () => {
    expect(getPosterUrl('/abc123.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/abc123.jpg');
    expect(getBackdropUrl('backdrop.jpg', 'w780')).toBe(
      'https://image.tmdb.org/t/p/w780/backdrop.jpg'
    );
  });

  it('preserves already resolved image URLs', () => {
    expect(getPosterUrl('https://cdn.example.com/poster.jpg')).toBe(
      'https://cdn.example.com/poster.jpg'
    );
    expect(getBackdropUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });

  it('returns the right fallback when the path is missing', () => {
    expect(getPosterUrl('')).toBe(FALLBACK_POSTER);
    expect(getBackdropUrl(null)).toBe(FALLBACK_BACKDROP);
  });
});
