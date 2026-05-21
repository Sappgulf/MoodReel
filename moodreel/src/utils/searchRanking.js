import { getDisplayTitle } from './mediaUtils';

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getRankScore(title, queryTokens, normalizedQuery, genres = [], moodGenres = []) {
  const normalizedTitle = normalize(title);
  if (!normalizedTitle) return 999;

  let score = 5;

  if (normalizedTitle === normalizedQuery) {
    score = 0;
  } else if (normalizedTitle.startsWith(`${normalizedQuery} `)) {
    score = 1;
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    score = 2;
  } else {
    const titleTokens = normalizedTitle.split(' ');
    const tokenMatches = queryTokens.reduce(
      (count, token) => (titleTokens.includes(token) ? count + 1 : count),
      0
    );

    if (tokenMatches === queryTokens.length && queryTokens.length > 0) {
      score = 2;
    } else if (normalizedTitle.includes(normalizedQuery)) {
      score = 3;
    } else if (tokenMatches > 0) {
      score = 4;
    }
  }

  // Mood Affinity Bonus: Subtract from score (lower is better)
  if (moodGenres.length > 0 && genres.length > 0) {
    const hasAffinity = genres.some(gId => moodGenres.includes(gId));
    if (hasAffinity) score -= 0.5; // Subtle boost for matching mood
  }

  return score;
}

export function applySearchRanking(results, query, getTieBreakers, moodGenres = []) {
  if (!query) return results;
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return results;

  const queryTokens = normalizedQuery.split(' ');
  const ranked = results.map(item => ({
    item,
    score: getRankScore(
      getDisplayTitle(item),
      queryTokens,
      normalizedQuery,
      item.genre_ids || [],
      moodGenres
    ),
  }));

  ranked.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;

    // Secondary sort: Popularity (heavy weight)
    const aPop = a.item.popularity || 0;
    const bPop = b.item.popularity || 0;

    // Recency Bonus: Boost newer films slightly within popularity tie-break
    const aYear = parseInt((a.item.release_date || a.item.first_air_date || '').split('-')[0]) || 0;
    const bYear = parseInt((b.item.release_date || b.item.first_air_date || '').split('-')[0]) || 0;

    if (Math.abs(aPop - bPop) > 10) return bPop - aPop;

    if (aYear !== bYear) return bYear - aYear;

    if (getTieBreakers) return getTieBreakers(a.item, b.item);
    return 0;
  });

  return ranked.map(({ item }) => item);
}

const searchRanking = {
  applySearchRanking,
};

export default searchRanking;
