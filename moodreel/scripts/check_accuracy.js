const searchService = require('./src/services/searchService').default;
const { parseMoodToGenres } = require('./src/utils/moodParser');

// Mock localStorage and window for Node environment
global.localStorage = {
  getItem: () => null,
  setItem: () => null,
  removeItem: () => null,
};

async function testAccuracy() {
  console.log('--- API Accuracy Test ---');

  const testCases = [
    { query: 'happy', expectedGenre: 35 },
    { query: 'scary', expectedGenre: 27 },
    { query: 'Inception', expectedTitle: 'Inception' },
    { query: 'nonsense query that should fail', expectEmpty: true },
  ];

  for (const test of testCases) {
    console.log(`\nTesting Query: "${test.query}"`);
    const genres = parseMoodToGenres(test.query);
    console.log(`Detected Genres: ${genres.join(', ') || 'None'}`);

    try {
      const result = await searchService.search({ query: test.query, type: 'all' });
      console.log(`Results Found: ${result.results.length}`);
      if (result.results.length > 0) {
        console.log(
          `Top Result: ${result.results[0].title} (Type: ${result.results[0].media_type})`
        );
        if (test.expectedTitle && !result.results[0].title.includes(test.expectedTitle)) {
          console.warn(`[FAIL] Expected title to include "${test.expectedTitle}"`);
        }
      } else if (!test.expectEmpty) {
        console.warn(`[FAIL] Expected results but found none.`);
      }
    } catch (err) {
      console.error(`[ERROR] ${err.message}`);
    }
  }
}

// Note: Running this requires TMDB API keys in environment
testAccuracy().catch(console.error);
