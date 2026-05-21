import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { collectProviderIds, itemMatchesSelectedProviders } from './providerFilter';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../test/fixtures');
const fixtures = JSON.parse(readFileSync(join(fixturesDir, 'tmdb-watch-providers.json'), 'utf8'));

describe('providerFilter', () => {
  it('collects provider IDs from TMDB fixture payloads', () => {
    expect(collectProviderIds(fixtures.movie_us_netflix)).toEqual([8]);
    expect(collectProviderIds(fixtures.movie_us_multi)).toEqual(expect.arrayContaining([337, 2]));
  });

  it('matches selected services against fixture data', () => {
    expect(itemMatchesSelectedProviders(fixtures.movie_us_netflix, [8])).toBe(true);
    expect(itemMatchesSelectedProviders(fixtures.movie_us_netflix, [337])).toBe(false);
    expect(itemMatchesSelectedProviders(fixtures.movie_us_multi, [337, 99])).toBe(true);
  });

  it('treats empty selection as pass-through', () => {
    expect(itemMatchesSelectedProviders(fixtures.movie_us_none, [])).toBe(true);
  });

  it('handles normalized provider objects', () => {
    const normalized = {
      flatrate: [{ id: 8, name: 'Netflix', logoPath: '/n.jpg', displayPriority: 1 }],
      rent: [],
      buy: [],
    };
    expect(itemMatchesSelectedProviders(normalized, [8])).toBe(true);
  });
});
