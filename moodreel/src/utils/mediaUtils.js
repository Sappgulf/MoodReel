export const FALLBACK_POSTER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#1a2332"/><stop offset="1" stop-color="#0d1117"/></linearGradient><linearGradient id="f" x1="0" x2="1" y1="0" y2="1"><stop stop-color="rgba(255,215,0,0.08)"/><stop offset="1" stop-color="rgba(255,215,0,0)"/></linearGradient></defs><rect fill="url(#g)" width="500" height="750"/><rect fill="url(#f)" width="500" height="750"/><rect x="175" y="275" width="150" height="200" rx="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="6" stroke-dasharray="12 8"/><circle cx="250" cy="230" r="30" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4"/><path d="M235 220 L250 210 L265 220 L265 240 L250 250 L235 240 Z" fill="rgba(255,255,255,0.06)"/><text fill="#8b93a4" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" text-anchor="middle" x="250" y="530">No poster available</text></svg>'
  );
export const FALLBACK_BACKDROP =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#1a2332"/><stop offset="1" stop-color="#0d1117"/></linearGradient></defs><rect fill="url(#bg)" width="1280" height="720"/><rect x="540" y="260" width="200" height="200" rx="24" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6" stroke-dasharray="12 8"/><text fill="#8b93a4" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="500" text-anchor="middle" x="640" y="510">No backdrop available</text></svg>'
  );
export const FALLBACK_TITLE = 'Untitled';
export const FALLBACK_OVERVIEW = 'No description available.';

export const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

export function getDisplayTitle(item) {
  return item?.title || item?.name || FALLBACK_TITLE;
}

export function getDisplayOverview(item) {
  return item?.overview?.trim() ? item.overview : FALLBACK_OVERVIEW;
}

export function getPosterUrl(path, size = 'w500') {
  if (!path) return FALLBACK_POSTER;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `https://image.tmdb.org/t/p/${size}/${cleanPath}`;
}

export function getBackdropUrl(path, size = 'original') {
  if (!path) return FALLBACK_BACKDROP;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `https://image.tmdb.org/t/p/${size}/${cleanPath}`;
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
    .map(provider => ({
      id: provider.provider_id,
      name: provider.provider_name,
      logoPath: provider.logo_path,
      displayPriority: provider.display_priority ?? 999,
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
  normalizeProviderList,
};

export default mediaUtils;
