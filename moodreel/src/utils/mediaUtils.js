export const FALLBACK_POSTER = 'https://via.placeholder.com/500x750?text=No+Poster';
export const FALLBACK_BACKDROP = 'https://via.placeholder.com/1280x720?text=No+Backdrop';
export const FALLBACK_TITLE = 'Untitled';
export const FALLBACK_OVERVIEW = 'No description available.';

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
    getDisplayTitle,
    getDisplayOverview,
    getPosterUrl,
    getBackdropUrl,
    getReleaseYear,
    normalizeProviderList
};

export default mediaUtils;
