import { describe, it, expect } from 'vitest';
import { getProviderAvailabilityStatus } from './providerAvailability';

describe('providerAvailability', () => {
  const item = { id: 1, media_type: 'movie' };

  it('returns unknown without services', () => {
    expect(getProviderAvailabilityStatus(item, {}, [])).toBe('unknown');
  });

  it('returns pending without map data', () => {
    expect(getProviderAvailabilityStatus(item, {}, [8])).toBe('pending');
  });

  it('returns confirmed when service matches', () => {
    const map = {
      'movie:1': { flatrate: [{ id: 8, provider_id: 8 }] },
    };
    expect(getProviderAvailabilityStatus(item, map, [8])).toBe('confirmed');
  });
});
