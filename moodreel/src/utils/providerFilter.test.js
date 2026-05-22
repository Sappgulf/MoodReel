import { describe, it, expect } from 'vitest';
import { itemMatchesSelectedProviders } from './providerFilter';

describe('providerFilter', () => {
  it('matches when a selected provider is in flatrate', () => {
    const data = { flatrate: [{ provider_id: 8 }], rent: [], buy: [] };
    expect(itemMatchesSelectedProviders(data, [8])).toBe(true);
    expect(itemMatchesSelectedProviders(data, [99])).toBe(false);
  });
});
