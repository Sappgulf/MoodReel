import { getDisplayTitle } from './mediaUtils';

function getRankScore(title, query) {
    const normalizedTitle = title.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    if (normalizedTitle === normalizedQuery) return 0;
    if (normalizedTitle.startsWith(normalizedQuery)) return 1;
    if (normalizedTitle.includes(normalizedQuery)) return 2;
    return 3;
}

export function applySearchRanking(results, query, getTieBreakers) {
    if (!query) return results;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return results;

    return [...results].sort((a, b) => {
        const aScore = getRankScore(getDisplayTitle(a), normalizedQuery);
        const bScore = getRankScore(getDisplayTitle(b), normalizedQuery);
        if (aScore !== bScore) return aScore - bScore;

        if (getTieBreakers) return getTieBreakers(a, b);
        return 0;
    });
}

const searchRanking = {
    applySearchRanking
};

export default searchRanking;
