export const FALLBACK_POSTER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750"><rect fill="#1a1a2e" width="500" height="750"/><text fill="#555" font-family="sans-serif" font-size="24" text-anchor="middle" x="250" y="375">No Poster</text></svg>');
export const FALLBACK_BACKDROP = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect fill="#1a1a2e" width="1280" height="720"/><text fill="#555" font-family="sans-serif" font-size="32" text-anchor="middle" x="640" y="360">No Backdrop</text></svg>');
export const FALLBACK_TITLE = 'Untitled';
export const FALLBACK_OVERVIEW = 'No description available.';

export const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

export function getDisplayTitle(item) {
    return item?.title || item?.name || FALLBACK_TITLE;
}

export function getDisplayOverview(item) {
    return item?.overview?.trim() ? item.overview : FALLBACK_OVERVIEW;
}

export function getPosterUrl(path, size = 'w500') {
    if (!path) return FALLBACK_POSTER;
    return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getBackdropUrl(path, size = 'original') {
    if (!path) return FALLBACK_BACKDROP;
    return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getReleaseYear(item) {
    const date = item?.release_date || item?.first_air_date;
    if (!date) return '';
    const year = new Date(date).getFullYear();
    return Number.isNaN(year) ? '' : year;
}

export function normalizeProviderList(list = []) {
    return list
        .filter(Boolean)
        .map((provider) => ({
            id: provider.provider_id,
            name: provider.provider_name,
            logoPath: provider.logo_path,
            displayPriority: provider.display_priority ?? 999
        }))
        .sort((a, b) => a.displayPriority - b.displayPriority);
}

const mediaUtils = {
    FALLBACK_POSTER,
    FALLBACK_BACKDROP,
    FALLBACK_TITLE,
    FALLBACK_OVERVIEW,
    GENRE_MAP,
    getDisplayTitle,
    getDisplayOverview,
    getPosterUrl,
    getBackdropUrl,
    getReleaseYear,
    normalizeProviderList
};

export default mediaUtils;
