import { describe, it, expect, beforeEach } from 'vitest';

import {
  clearMoodReelData,
  createPrivacyExport,
  importPrivacyData,
  parsePrivacyImport,
} from './privacyData';
import { StorageKeys as SK } from '../storage/storageKeys';

describe('privacyData', () => {
  beforeEach(() => {
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

  it('exports MoodReel storage without API key material', () => {
    window.localStorage.setItem(SK.WATCHLIST, JSON.stringify([{ id: 1 }]));
    window.localStorage.setItem(SK.TMDB_API_KEY_USER, 'secret');

    const backup = createPrivacyExport({ now: () => new Date('2026-01-01T00:00:00.000Z') });

    expect(backup.app).toBe('MoodReel');
    expect(backup.exportedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(backup.payload[SK.WATCHLIST]).toBe(JSON.stringify([{ id: 1 }]));
    expect(backup.payload[SK.TMDB_API_KEY_USER]).toBeUndefined();
  });

  it('imports only known MoodReel keys', () => {
    const raw = JSON.stringify({
      app: 'MoodReel',
      payload: {
        [SK.PROFILE]: '{"username":"Test"}',
        'other-app-key': 'ignored',
      },
    });

    expect(importPrivacyData(raw)).toBe(1);
    expect(window.localStorage.getItem(SK.PROFILE)).toBe('{"username":"Test"}');
    expect(window.localStorage.getItem('other-app-key')).toBeNull();
  });

  it('rejects non-MoodReel import files', () => {
    expect(() => parsePrivacyImport(JSON.stringify({ app: 'Other', payload: {} }))).toThrow(
      /MoodReel/
    );
  });

  it('rejects malformed import payloads', () => {
    expect(() => parsePrivacyImport('{bad json')).toThrow();
    expect(() => parsePrivacyImport(JSON.stringify({ app: 'MoodReel', payload: null }))).toThrow(
      /MoodReel/
    );
    expect(() =>
      parsePrivacyImport(JSON.stringify({ app: 'MoodReel', payload: ['not', 'an', 'object'] }))
    ).toThrow(/MoodReel/);
  });

  it('does not import sensitive API key material even from MoodReel exports', () => {
    const raw = JSON.stringify({
      app: 'MoodReel',
      payload: {
        [SK.WATCHLIST]: '[]',
        [SK.TMDB_API_KEY_USER]: 'should-not-import',
      },
    });

    expect(importPrivacyData(raw)).toBe(1);
    expect(window.localStorage.getItem(SK.WATCHLIST)).toBe('[]');
    expect(window.localStorage.getItem(SK.TMDB_API_KEY_USER)).toBeNull();
  });

  it('clears MoodReel-owned local data', () => {
    window.localStorage.setItem(SK.WATCHLIST, '[]');
    window.localStorage.setItem('unrelated', 'keep');

    clearMoodReelData();

    expect(window.localStorage.getItem(SK.WATCHLIST)).toBeNull();
    expect(window.localStorage.getItem('unrelated')).toBe('keep');
  });
});
