import { describe, it, expect, vi } from 'vitest';
import { safeGetJSON, safeSetJSON, safeRemove } from './safeStorage';

describe('safeStorage', () => {
  it('returns fallback values when reads fail', () => {
    window.localStorage.getItem.mockImplementationOnce(() => {
      throw new Error('storage blocked');
    });

    expect(safeGetJSON('blocked', { ok: true })).toEqual({ ok: true });
  });

  it('reports failed writes without throwing', () => {
    window.localStorage.setItem.mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });

    expect(safeSetJSON('blocked', { ok: true })).toBe(false);
  });

  it('ignores remove failures', () => {
    window.localStorage.removeItem.mockImplementationOnce(() => {
      throw new Error('remove blocked');
    });

    expect(() => safeRemove('blocked')).not.toThrow();
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('blocked');
    vi.clearAllMocks();
  });
});
