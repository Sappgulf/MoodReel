import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { StorageKeys } from '../storage/storageKeys';
import {
  sanitizeTonightPreferences,
  TONIGHT_PREFERENCES_DEFAULTS,
  useTonightPreferences,
} from './useTonightPreferences';

beforeEach(() => {
  localStorage.getItem.mockImplementation(() => null);
  localStorage.setItem.mockClear();
});

describe('sanitizeTonightPreferences', () => {
  it('returns defaults for empty input', () => {
    const result = sanitizeTonightPreferences({});
    expect(result.mood).toBe(TONIGHT_PREFERENCES_DEFAULTS.mood);
    expect(result.runtimeLimit).toBe(120);
    expect(result.tonightMode).toBe('easy-win');
    expect(result.activeConstraintIds.length).toBeGreaterThan(0);
  });

  it('rejects invalid values and keeps safe fields', () => {
    const result = sanitizeTonightPreferences({
      mood: 'rainy night comfort',
      runtimeLimit: 999,
      watchingContext: 'invalid',
      riskPreference: 'chaos',
      contentType: 'anime',
      minRating: 12,
      tonightMode: 'date-night',
      activeConstraintIds: ['streaming-now', 'high-rating'],
    });

    expect(result.mood).toBe('rainy night comfort');
    expect(result.runtimeLimit).toBe(120);
    expect(result.watchingContext).toBe('friends');
    expect(result.riskPreference).toBe('balanced');
    expect(result.contentType).toBe('all');
    expect(result.minRating).toBe(6.5);
    expect(result.tonightMode).toBe('date-night');
    expect(result.activeConstraintIds).toEqual(['streaming-now', 'high-rating']);
  });
});

describe('useTonightPreferences', () => {
  it('persists preference updates to localStorage', () => {
    const { result } = renderHook(() => useTonightPreferences());

    act(() => {
      result.current.setPreference('mood', 'low effort comedy');
      result.current.setPreference('runtimeLimit', 90);
    });

    expect(result.current.preferences.mood).toBe('low effort comedy');
    expect(result.current.preferences.runtimeLimit).toBe(90);
    expect(localStorage.setItem).toHaveBeenCalled();
    const lastCall = localStorage.setItem.mock.calls.at(-1);
    expect(lastCall[0]).toBe(StorageKeys.TONIGHT_PREFERENCES);
    expect(JSON.parse(lastCall[1]).mood).toBe('low effort comedy');
  });

  it('resets constraints when tonight mode changes', () => {
    const { result } = renderHook(() => useTonightPreferences());

    act(() => {
      result.current.setActiveConstraintIds(['wild-card']);
      result.current.setPreference('tonightMode', 'date-night');
    });

    expect(result.current.preferences.tonightMode).toBe('date-night');
    expect(result.current.preferences.activeConstraintIds).toEqual([
      'streaming-now',
      'high-rating',
      'no-horror',
    ]);
  });
});
