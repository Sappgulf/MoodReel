export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  media_type?: 'movie' | 'tv';
}

export interface TMDBMovie extends MediaItem {
  media_type: 'movie';
  title: string;
  release_date: string;
}

export interface TMDBTV extends MediaItem {
  media_type: 'tv';
  name: string;
  first_air_date: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  popularity?: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path?: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface WatchProvider {
  id: number;
  name: string;
  logoPath: string;
  displayPriority?: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface SearchParams {
  query?: string;
  type?: 'all' | 'movie' | 'tv';
  page?: number;
  genres?: number[];
  matchType?: 'all' | 'any';
  providers?: number[];
  minRating?: number;
  yearMin?: number;
  yearMax?: number;
  sortBy?: string;
  runtime?: 'any' | 'short' | 'medium' | 'long';
  region?: string;
  multiPage?: boolean;
}

export interface SearchResult {
  results: MediaItem[];
  page: number;
  totalPages: number;
  totalResults: number;
  hasMore: boolean;
  error?: string;
  isFallback?: boolean;
  isStale?: boolean;
}

export interface WatchlistItem extends MediaItem {
  addedAt?: number;
  watched?: boolean;
  userRating?: number;
  notes?: string;
}

export interface MoodHistoryEntry {
  mood: string;
  timestamp: number;
  date?: string;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface UserProfile {
  username: string;
  avatar: string;
  bio: string;
  joinDate: number;
}

export interface Toast {
  id?: string;
  icon?: string;
  title: string;
  message?: string;
  variant?: 'default' | 'error' | 'success' | 'achievement';
  duration?: number;
}

export interface RateLimitInfo {
  remaining: number;
  reset: number;
}

export type TasteStatus = 'liked' | 'disliked' | 'neutral';

export const GENRE_MAP: Record<number, string> = {
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
  37: 'Western'
};