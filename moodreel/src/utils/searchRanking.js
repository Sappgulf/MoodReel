import { getDisplayTitle } from './mediaUtils';

function normalize(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getRankScore(title, queryTokens, normalizedQuery) {
    const normalizedTitle = normalize(title);
    if (!normalizedTitle) return 999;

    if (normalizedTitle === normalizedQuery) return 0;
    if (normalizedTitle.startsWith(`${normalizedQuery} `) || normalizedTitle.startsWith(normalizedQuery)) return 1;

    const titleTokens = normalizedTitle.split(' ');
    const tokenMatches = queryTokens.reduce((count, token) => (titleTokens.includes(token) ? count + 1 : count), 0);

    if (tokenMatches === queryTokens.length && queryTokens.length > 0) return 2;
    if (normalizedTitle.includes(normalizedQuery)) return 3;
    if (tokenMatches > 0) return 4;

    return 5;
}

export function applySearchRanking(results, query, getTieBreakers) {
    if (!query) return results;
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return results;

    const queryTokens = normalizedQuery.split(' ');
    const ranked = results.map((item) => ({
        item,
        score: getRankScore(getDisplayTitle(item), queryTokens, normalizedQuery)
    }));

    ranked.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (getTieBreakers) return getTieBreakers(a.item, b.item);
        return 0;
    });

    return ranked.map(({ item }) => item);
}

const searchRanking = {
    applySearchRanking
};

export default searchRanking;
