import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import DiscoveryHero from '../components/home/DiscoveryHero';
import SurpriseWinnerBanner from '../components/home/SurpriseWinnerBanner';
import HomeTrendingStrip from '../components/home/HomeTrendingStrip';
import HomeResultsPanel from '../components/home/HomeResultsPanel';
import HomeDiscoveryConsole from '../components/home/HomeDiscoveryConsole';
import SaveVibeModal from '../components/SaveVibeModal';
import MoodPulse from '../components/MoodPulse';
import EmojiPicker from '../components/EmojiPicker';
import ShuffleOverlay from '../components/ShuffleOverlay';
import ErrorState from '../components/ErrorState';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAchievements } from '../hooks/useAchievements';
import { useMoodHistory } from '../hooks/useMoodHistory';
import { useCustomPlaylists } from '../hooks/useCustomPlaylists';
import { useSounds } from '../hooks/useSounds';
import { useMovieDiscovery } from '../hooks/useMovieDiscovery';
import { useSurpriseShuffle } from '../hooks/useSurpriseShuffle';
import { useWindowSize } from '../hooks/useWindowSize';
import { useProviderSettings } from '../hooks/useProviderSettings';
import { useTasteProfile } from '../hooks/useTasteProfile';
import { useToasts } from '../context/ToastContext';
import searchService from '../services/searchService';
import { safeGetJSON } from '../storage/safeStorage';
import { StorageKeys as SK } from '../storage/storageKeys';
import {
  fetchProviderCatalog,
  fetchTitleProviders,
  getCachedTitleProviders,
} from '../services/providerService';
import { applySearchRanking } from '../utils/searchRanking';
import { shouldSkipLog, isAbortError, getUserFacingMessage } from '../services/apiErrorUtils';

function getTitleTokens(item) {
  return (item.title || item.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 3);
}

function genreLabelFor(item, genres) {
  const genreId = item.genre_ids?.[0];
  return genres.find(genre => genre.id === genreId)?.name || '';
}

const CURATED_COLLECTIONS = [
  {
    id: 'under-90',
    label: 'Under 90 min',
    description: 'Fast, low-commitment picks for weeknights.',
    mood: 'tight paced comfort',
    filters: { runtime: 'short', sortBy: 'popularity.desc' },
  },
  {
    id: 'visual-comfort',
    label: 'Visual comfort',
    description: 'Warm, stylish titles for an easy couch reset.',
    mood: 'cozy visually beautiful',
    filters: { runtime: 'any', sortBy: 'vote_average.desc' },
  },
  {
    id: 'crowd-night',
    label: 'Crowd night',
    description: 'Popular crowd-pleasers with enough ratings to trust.',
    mood: 'fun crowd pleasing',
    filters: { runtime: 'medium', sortBy: 'popularity.desc' },
  },
  {
    id: 'hidden-gems',
    label: 'Hidden gems',
    description: 'Higher-rated picks outside the obvious first row.',
    mood: 'hidden gem',
    filters: { runtime: 'any', sortBy: 'vote_average.desc' },
  },
];

function Home() {
  const currentYear = new Date().getFullYear();
  const { isMobile } = useWindowSize();
  const location = useLocation();
  const { playSound } = useSounds();
  const { watchlist, isInWatchlist, toggleWatchlist, addToWatchlist, isWatched, toggleWatched } =
    useWatchlist();
  const { trackSave } = useAchievements();
  const { history: recentMoods, addToHistory } = useMoodHistory();
  const { playlists: _playlists, savePlaylist } = useCustomPlaylists();
  const { region, setRegion, myServices, setMyServices, toggleService } = useProviderSettings();
  const { profile, like, dislike, statusFor, showHidden, setShowHidden, tasteCounts } =
    useTasteProfile();
  const { pushToast } = useToasts();

  const { isSurpriseLoading, showWinnerInfo, surpriseMovie, closeSurprise, handleSurpriseMe } =
    useSurpriseShuffle({ playSound });

  const {
    mood,
    setMood,
    recommendations,
    setRecommendations,
    trending,
    error,
    selectedGenres,
    setSelectedGenres,
    selectedProviders,
    setSelectedProviders,
    isLoading,
    contentType,
    setContentType,
    matchType,
    hasMore,
    minRating,
    setMinRating,
    hasSearched,
    setHasSearched,
    advancedFilters,
    setAdvancedFilters,
    fetchTrending,
    search: getRecommendations,
    loadMore: loadMoreResults,
  } = useMovieDiscovery(currentYear, region);

  const [visibleCount, setVisibleCount] = useState(8);

  const [genres, setGenres] = useState([]);
  const [isCardLoading, setIsCardLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchScope, setSearchScope] = useState('within');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [isSearchingAll, setIsSearchingAll] = useState(false);
  const [providerSnapshot, setProviderSnapshot] = useState({});
  const [providerCatalog, setProviderCatalog] = useState([]);
  const [resultLayout, setResultLayout] = useState('poster');
  const [titleQuery, setTitleQuery] = useState('');
  const [showSaveVibeModal, setShowSaveVibeModal] = useState(false);
  const [shouldRunHydratedSearch, setShouldRunHydratedSearch] = useState(false);

  const loadMoreRef = useRef(null);
  const searchControllerRef = useRef(null);
  const hasHydratedRef = useRef(false);
  const moodInputRef = useRef(null);
  const titleSearchRef = useRef(null);
  const loadMoreDebounceRef = useRef(null);

  const handleSearch = useCallback(() => {
    if (mood) addToHistory(mood);
    setVisibleCount(8); // Reset staggered visibility
    getRecommendations();
  }, [mood, addToHistory, getRecommendations]);

  useEffect(() => {
    setSelectedProviders(myServices);
  }, [myServices, setSelectedProviders]);

  useEffect(() => {
    const handleFocusMood = () => moodInputRef.current?.focus();
    const handleFocusTitle = () => titleSearchRef.current?.focus();

    window.addEventListener('moodreel:focus-mood-search', handleFocusMood);
    window.addEventListener('moodreel:focus-title-search', handleFocusTitle);

    return () => {
      window.removeEventListener('moodreel:focus-mood-search', handleFocusMood);
      window.removeEventListener('moodreel:focus-title-search', handleFocusTitle);
    };
  }, []);

  useEffect(() => {
    if (hasHydratedRef.current) return;
    const params = new URLSearchParams(location.search);
    const moodParam = params.get('mood');
    const queryParam = params.get('query');
    const typeParam = params.get('type');
    const yearMinParam = params.get('yearMin');
    const yearMaxParam = params.get('yearMax');
    const ratingParam = params.get('rating');
    const regionParam = params.get('region');
    const servicesParam = params.get('services');
    const scopeParam = params.get('scope');
    const showHiddenParam = params.get('showHidden');

    if (moodParam) setMood(moodParam);
    if (queryParam) setTitleQuery(queryParam);
    if (typeParam) setContentType(typeParam);
    if (scopeParam) setSearchScope(scopeParam);
    if (regionParam) setRegion(regionParam);

    if (yearMinParam || yearMaxParam || ratingParam) {
      setAdvancedFilters(prev => ({
        ...prev,
        yearMin: yearMinParam ? parseInt(yearMinParam, 10) : prev.yearMin,
        yearMax: yearMaxParam ? parseInt(yearMaxParam, 10) : prev.yearMax,
      }));
      if (ratingParam) setMinRating(parseFloat(ratingParam));
    }

    if (servicesParam) {
      const ids = servicesParam
        .split(',')
        .map(id => parseInt(id, 10))
        .filter(Boolean);
      setMyServices(ids);
    }

    if (showHiddenParam) {
      setShowHidden(showHiddenParam === 'true');
    }

    hasHydratedRef.current = true;

    if (moodParam) {
      setShouldRunHydratedSearch(true);
    }
  }, [
    location.search,
    setAdvancedFilters,
    setContentType,
    setMinRating,
    setMood,
    setMyServices,
    setRegion,
    setSearchScope,
    setShowHidden,
  ]);

  useEffect(() => {
    if (!shouldRunHydratedSearch || !mood.trim()) return;
    setShouldRunHydratedSearch(false);
    handleSearch();
  }, [handleSearch, mood, shouldRunHydratedSearch]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    const params = new URLSearchParams();

    if (mood) params.set('mood', mood);
    if (titleQuery) params.set('query', titleQuery);
    if (contentType && contentType !== 'all') params.set('type', contentType);
    if (advancedFilters.yearMin && advancedFilters.yearMin > 1900)
      params.set('yearMin', advancedFilters.yearMin);
    if (advancedFilters.yearMax && advancedFilters.yearMax < currentYear)
      params.set('yearMax', advancedFilters.yearMax);
    if (minRating > 0) params.set('rating', minRating);
    if (region && region !== 'US') params.set('region', region);
    if (myServices.length > 0) params.set('services', myServices.join(','));
    if (searchScope !== 'within') params.set('scope', searchScope);
    if (showHidden) params.set('showHidden', 'true');

    const queryString = params.toString();
    const nextUrl = `${location.pathname}${queryString ? `?${queryString}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, [
    mood,
    titleQuery,
    contentType,
    advancedFilters,
    minRating,
    region,
    myServices,
    searchScope,
    showHidden,
    location.pathname,
    currentYear,
  ]);

  // Dynamic Mood Themes
  useEffect(() => {
    const body = document.body;
    body.classList.remove('mood-romantic', 'mood-thriller', 'mood-happy', 'mood-classic');

    if (!mood) return;

    const moodLower = mood.toLowerCase();
    if (moodLower.includes('romance') || moodLower.includes('love') || moodLower.includes('date')) {
      body.classList.add('mood-romantic');
    } else if (
      moodLower.includes('thrill') ||
      moodLower.includes('scary') ||
      moodLower.includes('horror') ||
      moodLower.includes('dark')
    ) {
      body.classList.add('mood-thriller');
    } else if (
      moodLower.includes('happy') ||
      moodLower.includes('uplift') ||
      moodLower.includes('fun') ||
      moodLower.includes('comedy')
    ) {
      body.classList.add('mood-happy');
    } else if (
      moodLower.includes('classic') ||
      moodLower.includes('old') ||
      moodLower.includes('noir') ||
      moodLower.includes('retro')
    ) {
      body.classList.add('mood-classic');
    }

    return () =>
      body.classList.remove('mood-romantic', 'mood-thriller', 'mood-happy', 'mood-classic');
  }, [mood]);

  // Fetch trending on mount
  useEffect(() => {
    const controller = new AbortController();
    fetchTrending(controller.signal);
    return () => controller.abort();
  }, [fetchTrending]);

  useEffect(() => {
    setProviderSnapshot({});
  }, [region]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(titleQuery.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [titleQuery]);

  const performAllSearch = useCallback(
    async (query, controller) => {
      try {
        const result = await searchService.search(
          {
            query,
            type: contentType,
            genres: [],
            providers: selectedProviders,
            minRating,
            matchType,
            region,
            ...advancedFilters,
            page: 1,
            multiPage: true,
          },
          controller.signal
        );

        if (result.error) {
          setSearchError(result.error);
        }
        setSearchResults(result.results || []);
      } catch (err) {
        if (!shouldSkipLog(err)) {
          console.error('Error performing title search:', err);
        }
        if (!isAbortError(err)) {
          setSearchError(getUserFacingMessage(err));
        }
      } finally {
        setIsSearchingAll(false);
      }
    },
    [contentType, selectedProviders, minRating, matchType, region, advancedFilters]
  );

  useEffect(() => {
    if (searchScope !== 'all') {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    if (!debouncedQuery) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    if (searchControllerRef.current) {
      searchControllerRef.current.abort();
    }
    const controller = new AbortController();
    searchControllerRef.current = controller;
    setIsSearchingAll(true);
    setSearchError('');

    performAllSearch(debouncedQuery, controller);

    return () => controller.abort();
  }, [debouncedQuery, searchScope, performAllSearch]);

  // Fetch genres
  useEffect(() => {
    const controller = new AbortController();
    const fetchGenres = async () => {
      try {
        const endpoint = contentType === 'tv' ? 'tv' : 'movie';
        const data = await searchService.fetchGenres(endpoint, controller.signal);
        setGenres(data);
      } catch (err) {
        if (!shouldSkipLog(err)) {
          console.error('Error fetching genres:', err);
        }
      }
    };
    fetchGenres();
    return () => controller.abort();
  }, [contentType]);

  useEffect(() => {
    const controller = new AbortController();
    const loadProviders = async () => {
      try {
        const [movieProviders, tvProviders] = await Promise.all([
          fetchProviderCatalog('movie', region, controller.signal),
          fetchProviderCatalog('tv', region, controller.signal),
        ]);
        const merged = [...movieProviders, ...tvProviders].reduce((acc, provider) => {
          if (!acc.some(p => p.id === provider.id)) {
            acc.push(provider);
          }
          return acc;
        }, []);
        setProviderCatalog(merged);
      } catch (err) {
        if (!shouldSkipLog(err)) {
          console.error('Error fetching provider catalog:', err);
        }
      }
    };
    loadProviders();
    return () => controller.abort();
  }, [region]);

  // Infinite scroll observer (debounced to prevent request storms)
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 12);
          if (loadMoreDebounceRef.current) {
            clearTimeout(loadMoreDebounceRef.current);
          }
          loadMoreDebounceRef.current = setTimeout(() => {
            loadMoreResults();
          }, 400);
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(loadMoreRef.current);
    return () => {
      observer.disconnect();
      if (loadMoreDebounceRef.current) {
        clearTimeout(loadMoreDebounceRef.current);
      }
    };
  }, [hasMore, loadMoreResults]);

  const handleGenreClick = useCallback(
    genreId => {
      setSelectedGenres(prev =>
        prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
      );
    },
    [setSelectedGenres]
  );

  const handleProviderToggle = useCallback(
    providerId => {
      toggleService(providerId);
    },
    [toggleService]
  );

  const handleEmojiSelect = useCallback(
    emojiMood => {
      setMood(emojiMood.keyword);
      if (navigator.vibrate) navigator.vibrate(15);
      setSelectedGenres(prev => {
        const next = new Set(prev);
        emojiMood.genres.forEach(genreId => next.add(genreId));
        return Array.from(next);
      });
    },
    [setMood, setSelectedGenres]
  );

  const handleSwipeRight = useCallback(
    movie => {
      setIsCardLoading(true);
      playSound('save');
      const added = addToWatchlist(movie);
      if (added) trackSave(added);
      setRecommendations(prev => prev.filter(m => m.id !== movie.id));
      setTimeout(() => setIsCardLoading(false), 300);
    },
    [addToWatchlist, trackSave, playSound, setRecommendations]
  );

  const handleSwipeLeft = useCallback(
    movie => {
      setIsCardLoading(true);
      playSound('swipe');
      setRecommendations(prev => prev.filter(m => m.id !== movie.id));
      setTimeout(() => setIsCardLoading(false), 300);
    },
    [playSound, setRecommendations]
  );

  const suggestedVibeName = useMemo(() => {
    if (mood) return mood.replace(/\b\w/g, char => char.toUpperCase());
    if (selectedGenres.length > 0) return 'Custom Genre Mix';
    return 'My MoodReel Vibe';
  }, [mood, selectedGenres.length]);

  const handleSaveVibe = useCallback(() => {
    if (!mood && selectedGenres.length === 0) return;
    setShowSaveVibeModal(true);
  }, [mood, selectedGenres.length]);

  const handleConfirmSaveVibe = useCallback(
    name => {
      savePlaylist(name, {
        mood,
        contentType,
        selectedGenres,
        selectedProviders,
        minRating,
        advancedFilters,
      });
      playSound('save');
      pushToast({
        icon: '✨',
        title: 'Vibe saved',
        message: `"${name}" added to your playlists.`,
        duration: 3000,
      });
      setShowSaveVibeModal(false);
    },
    [
      mood,
      contentType,
      selectedGenres,
      selectedProviders,
      minRating,
      advancedFilters,
      savePlaylist,
      playSound,
      pushToast,
    ]
  );

  const handleClearFilters = useCallback(() => {
    setSelectedGenres([]);
    setMinRating(0);
    setAdvancedFilters({
      yearMin: 1900,
      yearMax: currentYear,
      sortBy: 'popularity.desc',
      matchType: 'all',
      runtime: 'any',
      region: 'US',
    });
    playSound('pop');
  }, [setSelectedGenres, setMinRating, setAdvancedFilters, currentYear, playSound]);

  const handleCollectionSelect = useCallback(
    collection => {
      setMood(collection.mood);
      setAdvancedFilters(prev => ({
        ...prev,
        ...collection.filters,
        yearMax: currentYear,
      }));
      setMinRating(collection.id === 'hidden-gems' || collection.id === 'visual-comfort' ? 7 : 0);
      playSound('pop');
      window.setTimeout(() => handleSearch(), 0);
    },
    [currentYear, handleSearch, playSound, setAdvancedFilters, setMinRating, setMood]
  );

  const timeContext = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12)
      return { greeting: 'Good morning!', suggestion: 'uplifting', emoji: '☀️' };
    if (hour >= 12 && hour < 17)
      return { greeting: 'Good afternoon!', suggestion: 'adventure', emoji: '🌤️' };
    if (hour >= 17 && hour < 21)
      return { greeting: 'Good evening!', suggestion: 'date night', emoji: '🌅' };
    return { greeting: 'Late night vibes', suggestion: 'thriller', emoji: '🌙' };
  }, []);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedGenres.length > 0) count++;
    if (myServices.length > 0) count++;
    if (minRating > 0) count++;
    if (advancedFilters.yearMin > 1900) count++;
    if (advancedFilters.yearMax < currentYear) count++;
    if (advancedFilters.runtime && advancedFilters.runtime !== 'any') count++;
    if (advancedFilters.sortBy && advancedFilters.sortBy !== 'popularity.desc') count++;
    return count;
  }, [selectedGenres, myServices, minRating, advancedFilters, currentYear]);

  const featuredItem = useMemo(() => {
    return recommendations[0] || trending[0] || null;
  }, [recommendations, trending]);

  const featuredLink = featuredItem
    ? `/${featuredItem.media_type || contentType}/${featuredItem.id}`
    : null;

  const watchHistory = useMemo(() => safeGetJSON(SK.WATCH_HISTORY, []), []);

  const watchlistGenreCounts = useMemo(() => {
    return watchlist.reduce((acc, item) => {
      (item.genre_ids || []).forEach(genreId => {
        acc[genreId] = (acc[genreId] || 0) + 1;
      });
      return acc;
    }, {});
  }, [watchlist]);

  // Destructure taste arrays for stable useMemo dependencies
  const { liked: likedKeys = [], disliked: dislikedKeys = [] } = profile || {};

  const heroTitle = mood ? `Tuned for “${mood}”` : 'Find the film that fits tonight.';

  const heroDescription = mood
    ? 'Your current mood is already shaping the feed. Refine the service, rating, or genre mix, then lock in a pick.'
    : 'Start with a feeling, narrow the field with filters, and keep the best option one tap away.';

  const heroMoodLabel = mood || timeContext.suggestion;

  const filteredRecommendations = useMemo(() => {
    if (minRating <= 0) return recommendations;
    return recommendations.filter(m => m.vote_average >= minRating);
  }, [recommendations, minRating]);

  const tieBreakers = useCallback((a, b) => {
    const aPopularity = a.popularity || 0;
    const bPopularity = b.popularity || 0;
    if (aPopularity !== bPopularity) return bPopularity - aPopularity;
    return (b.vote_count || 0) - (a.vote_count || 0);
  }, []);

  const scopedResults = useMemo(() => {
    if (debouncedQuery && searchScope === 'within') {
      const filtered = filteredRecommendations.filter(item => {
        const title = (item.title || item.name || '').toLowerCase();
        return title.includes(debouncedQuery.toLowerCase());
      });
      return applySearchRanking(filtered, debouncedQuery, tieBreakers, selectedGenres);
    }
    if (debouncedQuery && searchScope === 'all') {
      return applySearchRanking(searchResults, debouncedQuery, tieBreakers, selectedGenres);
    }
    return filteredRecommendations;
  }, [
    filteredRecommendations,
    searchResults,
    debouncedQuery,
    searchScope,
    tieBreakers,
    selectedGenres,
  ]);

  const tasteAdjustedResults = useMemo(() => {
    let results = scopedResults;
    if (!showHidden) {
      results = results.filter(
        item => statusFor(item.id, item.media_type || contentType) !== 'disliked'
      );
    }
    const recentTokens = new Set(watchHistory.slice(0, 12).flatMap(getTitleTokens));
    const recentKeys = new Set(
      watchHistory.slice(0, 30).map(item => `${item.id}-${item.media_type || 'movie'}`)
    );
    const mediaTypeCounts = watchHistory.reduce((acc, item) => {
      const type = item.media_type || 'movie';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const getPreferenceScore = item => {
      const mediaType = item.media_type || contentType;
      const status = statusFor(item.id, mediaType);
      const key = `${item.id}-${mediaType}`;
      let score = 0;
      if (status === 'liked') score += 60;
      if (status === 'disliked') score -= 80;
      if (likedKeys.includes(key)) score += 20;
      if (dislikedKeys.includes(key)) score -= 50;
      if (recentKeys.has(key)) score -= 12;
      if (isInWatchlist(item.id)) score -= 8;
      score += (item.genre_ids || []).reduce(
        (sum, genreId) => sum + Math.min(watchlistGenreCounts[genreId] || 0, 4) * 4,
        0
      );
      score += Math.min(mediaTypeCounts[mediaType] || 0, 6) * 2;
      score += getTitleTokens(item).filter(token => recentTokens.has(token)).length * 3;
      return score;
    };

    return [...results].sort((a, b) => {
      const aStatus = statusFor(a.id, a.media_type || contentType);
      const bStatus = statusFor(b.id, b.media_type || contentType);
      if (aStatus !== bStatus) {
        if (aStatus === 'liked') return -1;
        if (bStatus === 'liked') return 1;
        if (aStatus === 'disliked') return 1;
        if (bStatus === 'disliked') return -1;
      }
      return getPreferenceScore(b) - getPreferenceScore(a);
    });
  }, [
    scopedResults,
    showHidden,
    statusFor,
    contentType,
    watchHistory,
    likedKeys,
    dislikedKeys,
    isInWatchlist,
    watchlistGenreCounts,
  ]);

  const getProviderKey = useCallback(
    item => {
      return `${item.id}-${item.media_type || contentType}-${region}`;
    },
    [contentType, region]
  );

  const getRecommendationReason = useCallback(
    item => {
      const mediaType = item.media_type || contentType;
      const status = statusFor(item.id, mediaType);
      if (status === 'liked') return 'Because you liked this title';
      const cached =
        providerSnapshot[getProviderKey(item)] ||
        getCachedTitleProviders(item.id, mediaType, region);
      if (
        myServices.length > 0 &&
        cached?.flatrate?.some(provider => myServices.includes(provider.id))
      ) {
        return 'Available on one of your services';
      }
      const genreLabel = genreLabelFor(item, genres);
      const matchingWatchlistGenres = (item.genre_ids || []).filter(
        genreId => watchlistGenreCounts[genreId] > 0
      );
      if (mood && genreLabel) return `Matches your ${mood} mood through ${genreLabel}`;
      if (matchingWatchlistGenres.length > 0 && genreLabel) {
        return `Boosted by your saved ${genreLabel} picks`;
      }
      if (watchHistory.some(historyItem => historyItem.media_type === mediaType)) {
        return `More ${mediaType === 'tv' ? 'series' : 'movies'} based on your history`;
      }
      if (item.vote_average >= 8) return 'Highly rated by TMDB viewers';
      return item.media_type === 'tv' ? 'Series pick for this vibe' : 'Movie pick for this vibe';
    },
    [
      contentType,
      statusFor,
      providerSnapshot,
      getProviderKey,
      region,
      myServices,
      genres,
      mood,
      watchHistory,
      watchlistGenreCounts,
    ]
  );

  const filteredByServices = useMemo(() => {
    if (myServices.length === 0) return tasteAdjustedResults;
    return tasteAdjustedResults.filter(item => {
      const mediaType = item.media_type || contentType;
      const cached =
        providerSnapshot[getProviderKey(item)] ||
        getCachedTitleProviders(item.id, mediaType, region);
      if (!cached) return true;
      const ids = [
        ...cached.flatrate.map(p => p.id),
        ...cached.rent.map(p => p.id),
        ...cached.buy.map(p => p.id),
      ];
      return myServices.some(id => ids.includes(id));
    });
  }, [tasteAdjustedResults, myServices, providerSnapshot, getProviderKey, contentType, region]);

  const handleSmartSurprise = useCallback(() => {
    const avoidKeys = [
      ...(profile?.liked || []),
      ...(profile?.disliked || []),
      ...watchHistory.slice(0, 30).map(item => `${item.id}-${item.media_type || 'movie'}`),
    ];
    handleSurpriseMe({
      candidates: filteredByServices.length > 0 ? filteredByServices : trending,
      avoidKeys,
    });
  }, [filteredByServices, handleSurpriseMe, profile, trending, watchHistory]);

  useEffect(() => {
    if (filteredByServices.length === 0) return;
    const controller = new AbortController();
    const itemsToFetch = filteredByServices.slice(0, 12);
    let newSnapshot = {};

    const fetchAll = itemsToFetch.map(async item => {
      const mediaType = item.media_type || contentType;
      const key = getProviderKey(item);
      const cached = providerSnapshot[key] || getCachedTitleProviders(item.id, mediaType, region);
      if (cached) return;

      try {
        const data = await fetchTitleProviders(item.id, mediaType, region, controller.signal);
        newSnapshot[key] = data;
      } catch (err) {
        if (!shouldSkipLog(err)) {
          console.error('Provider lookup failed:', err);
        }
      }
    });

    Promise.all(fetchAll).then(() => {
      if (Object.keys(newSnapshot).length > 0) {
        setProviderSnapshot(prev => ({
          ...prev,
          ...newSnapshot,
        }));
      }
    });

    return () => controller.abort();
  }, [filteredByServices, contentType, getProviderKey, providerSnapshot, region]);

  const isBusy = isLoading || isSearchingAll;
  const hasAnySearch = hasSearched || (searchScope === 'all' && debouncedQuery);

  return (
    <main className="page-enter discovery-page">
      <ShuffleOverlay
        isActive={isSurpriseLoading}
        isWinner={showWinnerInfo}
        winnerItem={surpriseMovie}
        results={trending.length > 0 ? trending : recommendations}
        onDismiss={closeSurprise}
      />

      {showWinnerInfo && surpriseMovie && (
        <SurpriseWinnerBanner surpriseMovie={surpriseMovie} onClose={closeSurprise} />
      )}

      <SaveVibeModal
        isOpen={showSaveVibeModal}
        defaultName={suggestedVibeName}
        onClose={() => setShowSaveVibeModal(false)}
        onSave={handleConfirmSaveVibe}
      />

      {/* Unified Discovery Surface */}
      <section className="discovery-surface">
        <DiscoveryHero
          isLoading={isLoading}
          featuredItem={featuredItem}
          featuredLink={featuredLink}
          heroTitle={heroTitle}
          heroDescription={heroDescription}
          heroMoodLabel={heroMoodLabel}
          activeFilterCount={activeFilterCount}
          mood={mood}
          selectedGenres={selectedGenres}
          myServices={myServices}
          timeContext={timeContext}
          handleSearch={handleSearch}
          setMood={setMood}
          hasAnySearch={hasAnySearch}
          moodInputRef={moodInputRef}
          recentMoods={recentMoods}
          playSound={playSound}
          isBusy={isBusy}
          contentType={contentType}
          setContentType={setContentType}
          setRecommendations={setRecommendations}
          setHasSearched={setHasSearched}
        />

        {/* Compact Context Toolbar */}
        <div className="context-toolbar">
          <div className="context-toolbar-left">
            <span className="context-pill">
              {timeContext.emoji} {timeContext.greeting}
            </span>
            {activeFilterCount > 0 && (
              <span className="context-pill context-pill-active">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </span>
            )}
            {myServices.length > 0 && (
              <span className="context-pill context-pill-active">
                {myServices.length} service{myServices.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="context-toolbar-right">
            <button
              className={`surprise-pill ${isSurpriseLoading ? 'shuffle-anim' : ''}`}
              type="button"
              onClick={handleSmartSurprise}
              disabled={isSurpriseLoading}
            >
              {isSurpriseLoading ? '🎲' : 'Shuffle'}
            </button>
          </div>
        </div>

        {/* Horizontal Curated Collections */}
        {!hasAnySearch && (
          <div className="curated-strip">
            <span className="curated-strip-label">Curated</span>
            <div className="curated-chips">
              {CURATED_COLLECTIONS.map(collection => (
                <button
                  key={collection.id}
                  type="button"
                  className="curated-chip"
                  onClick={() => handleCollectionSelect(collection)}
                >
                  {collection.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Compact Emoji Quick-Pick */}
        {!hasAnySearch && (
          <div className="emoji-quick-bar">
            <EmojiPicker onSelect={handleEmojiSelect} selectedGenres={selectedGenres} />
          </div>
        )}
      </section>

      {/* Trending — compact, only when idle */}
      <HomeTrendingStrip
        trending={trending}
        recommendationsLength={recommendations.length}
        hasAnySearch={hasAnySearch}
        region={region}
        providerSnapshot={providerSnapshot}
        getProviderKey={getProviderKey}
        isInWatchlist={isInWatchlist}
        toggleWatchlist={toggleWatchlist}
        isWatched={isWatched}
        toggleWatched={toggleWatched}
        like={like}
        dislike={dislike}
        statusFor={statusFor}
      />

      {/* Mood Pulse — compact sidebar feel */}
      {!hasAnySearch && (
        <div className="mood-pulse-inline">
          <MoodPulse />
        </div>
      )}

      <HomeDiscoveryConsole
        contentType={contentType}
        setContentType={setContentType}
        setRecommendations={setRecommendations}
        setHasSearched={setHasSearched}
        resultLayout={resultLayout}
        setResultLayout={setResultLayout}
        mood={mood}
        setMood={setMood}
        moodInputRef={moodInputRef}
        recentMoods={recentMoods}
        playSound={playSound}
        titleQuery={titleQuery}
        setTitleQuery={setTitleQuery}
        titleSearchRef={titleSearchRef}
        searchScope={searchScope}
        setSearchScope={setSearchScope}
        isBusy={isBusy}
        handleSearch={handleSearch}
        pushToast={pushToast}
        handleEmojiSelect={handleEmojiSelect}
        selectedGenres={selectedGenres}
        recommendations={recommendations}
        isLoading={isLoading}
        setSelectedGenres={setSelectedGenres}
        setSelectedProviders={setSelectedProviders}
        setMinRating={setMinRating}
        setAdvancedFilters={setAdvancedFilters}
        minRating={minRating}
        advancedFilters={advancedFilters}
        handleClearFilters={handleClearFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        activeFilterCount={activeFilterCount}
        genres={genres}
        handleGenreClick={handleGenreClick}
        selectedProviders={selectedProviders}
        handleProviderToggle={handleProviderToggle}
        providerCatalog={providerCatalog}
      />

      {error && <ErrorState title="Search error" message={error} onRetry={handleSearch} />}

      {searchError && searchScope === 'all' && (
        <ErrorState
          title="Search error"
          message={searchError}
          onRetry={() => {
            if (!debouncedQuery) return;
            const controller = new AbortController();
            searchControllerRef.current = controller;
            setIsSearchingAll(true);
            setSearchError('');
            performAllSearch(debouncedQuery, controller);
          }}
        />
      )}

      <HomeResultsPanel
        isBusy={isBusy}
        filteredByServices={filteredByServices}
        isMobile={isMobile}
        hasAnySearch={hasAnySearch}
        isCardLoading={isCardLoading}
        handleSwipeLeft={handleSwipeLeft}
        handleSwipeRight={handleSwipeRight}
        filteredByServicesFirst={filteredByServices[0]}
        filteredByServicesSecond={filteredByServices[1]}
        visibleCount={visibleCount}
        resultLayout={resultLayout}
        isInWatchlist={isInWatchlist}
        toggleWatchlist={toggleWatchlist}
        isWatched={isWatched}
        toggleWatched={toggleWatched}
        providerSnapshot={providerSnapshot}
        getProviderKey={getProviderKey}
        getCachedTitleProvidersFn={(id, mediaType, reg) =>
          getCachedTitleProviders(id, mediaType, reg)
        }
        region={region}
        like={like}
        dislike={dislike}
        tasteCounts={tasteCounts}
        showHidden={showHidden}
        setShowHidden={setShowHidden}
        statusFor={statusFor}
        getRecommendationReason={getRecommendationReason}
        handleSaveVibe={handleSaveVibe}
        setMood={setMood}
        handleClearFilters={handleClearFilters}
        hasMore={hasMore}
        isLoading={isLoading}
        loadMoreResults={loadMoreResults}
        searchScope={searchScope}
        loadMoreRef={loadMoreRef}
      />
    </main>
  );
}

export default Home;
