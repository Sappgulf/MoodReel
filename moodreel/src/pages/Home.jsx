import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import DiscoveryHero from '../components/home/DiscoveryHero';
import SurpriseWinnerBanner from '../components/home/SurpriseWinnerBanner';
import HomeTrendingStrip from '../components/home/HomeTrendingStrip';
import ContinueWatchingStrip from '../components/home/ContinueWatchingStrip';
import OnMyServicesStrip from '../components/home/OnMyServicesStrip';
import HomeResultsPanel from '../components/home/HomeResultsPanel';
import HomeDiscoveryConsole from '../components/home/HomeDiscoveryConsole';
import HomeTonightSetup from '../components/home/HomeTonightSetup';
import SaveVibeModal from '../components/SaveVibeModal';
import MoodPulse from '../components/MoodPulse';
import EmojiPicker from '../components/EmojiPicker';
import ShuffleOverlay from '../components/ShuffleOverlay';
import ErrorState from '../components/ErrorState';
import { CURATED_COLLECTIONS, DECISION_FEEDBACK, REROLL_INTENTS } from '../constants/homeDiscovery';
import { useWatchlist } from '../hooks/useWatchlist';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useAchievements } from '../hooks/useAchievements';
import { useMoodHistory } from '../hooks/useMoodHistory';
import { useCustomPlaylists } from '../hooks/useCustomPlaylists';
import { useSounds } from '../hooks/useSounds';
import { useMovieDiscovery } from '../hooks/useMovieDiscovery';
import { useDiscoveryUrlState } from '../hooks/useDiscoveryUrlState';
import { useSurpriseShuffle } from '../hooks/useSurpriseShuffle';
import { useWindowSize } from '../hooks/useWindowSize';
import { useProviderSettings } from '../hooks/useProviderSettings';
import { useTasteProfile } from '../hooks/useTasteProfile';
import { useTonightPreferences } from '../hooks/useTonightPreferences';
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
import { copyToClipboard } from '../utils/clipboard';
import {
  buildTonightPicks,
  getRecommendationKey,
  NIGHT_CONSTRAINTS,
  rankRecommendations,
  TASTE_SETTING_DEFAULTS,
  TONIGHT_MODES,
} from '../utils/recommendationScoring';
import { shouldSkipLog, isAbortError, getUserFacingMessage } from '../services/apiErrorUtils';

function genreLabelFor(item, genres) {
  const genreId = item.genre_ids?.[0];
  return genres.find(genre => genre.id === genreId)?.name || '';
}

const TASTE_SETTINGS_KEY = 'moodreel-taste-settings';

function getReadableTitle(item) {
  return item?.title || item?.name || 'This title';
}

function Home() {
  const currentYear = new Date().getFullYear();
  const { isMobile } = useWindowSize();
  const { playSound } = useSounds();
  const { watchlist, isInWatchlist, toggleWatchlist, addToWatchlist, isWatched, toggleWatched } =
    useWatchlist();
  const { trackSave } = useAchievements();
  const { history: recentMoods, addToHistory } = useMoodHistory();
  const { history: watchHistoryEntries } = useWatchHistory();
  const { playlists: _playlists, savePlaylist, shareableVibeUrl } = useCustomPlaylists();
  const { region, setRegion, myServices, setMyServices, toggleService } = useProviderSettings();
  const { profile, like, dislike, statusFor, showHidden, setShowHidden, tasteCounts } =
    useTasteProfile();
  const { pushToast } = useToasts();
  const {
    preferences: tonightPreferences,
    setPreference: setTonightPreference,
    setActiveConstraintIds,
  } = useTonightPreferences();
  const { tonightMode, activeConstraintIds } = tonightPreferences;

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
  } = useMovieDiscovery(currentYear, region, [], { tasteProfile: profile });

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
  const [passedDecisionIds, setPassedDecisionIds] = useState([]);
  const [lockedPickId, setLockedPickId] = useState('');
  const [decisionFeedback, setDecisionFeedback] = useState({});
  const [isWinnerOverlayOpen, setIsWinnerOverlayOpen] = useState(false);

  const loadMoreRef = useRef(null);
  const searchControllerRef = useRef(null);
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

  useDiscoveryUrlState({
    mood,
    setMood,
    titleQuery,
    setTitleQuery,
    contentType,
    setContentType,
    advancedFilters,
    setAdvancedFilters,
    minRating,
    setMinRating,
    region,
    setRegion,
    myServices,
    setMyServices,
    selectedGenres,
    setSelectedGenres,
    searchScope,
    setSearchScope,
    showHidden,
    setShowHidden,
    currentYear,
    handleSearch,
  });

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
          controller.signal,
          { tasteProfile: profile }
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
    [contentType, selectedProviders, minRating, matchType, region, advancedFilters, profile]
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
      const movieKey = getRecommendationKey(movie, movie.media_type || contentType);
      setRecommendations(prev =>
        prev.filter(m => getRecommendationKey(m, m.media_type || contentType) !== movieKey)
      );
      setTimeout(() => setIsCardLoading(false), 300);
    },
    [addToWatchlist, trackSave, playSound, setRecommendations, contentType]
  );

  const handleSwipeLeft = useCallback(
    movie => {
      setIsCardLoading(true);
      playSound('swipe');
      const movieKey = getRecommendationKey(movie, movie.media_type || contentType);
      setRecommendations(prev =>
        prev.filter(m => getRecommendationKey(m, m.media_type || contentType) !== movieKey)
      );
      setTimeout(() => setIsCardLoading(false), 300);
    },
    [playSound, setRecommendations, contentType]
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

  const handleShareVibe = useCallback(async () => {
    if (!mood && selectedGenres.length === 0) {
      pushToast({
        icon: '⚠️',
        title: 'Nothing to share',
        message: 'Pick a mood or genre first.',
        variant: 'error',
        duration: 3000,
      });
      return;
    }
    const shareName = mood ? `${mood.charAt(0).toUpperCase()}${mood.slice(1)}` : 'Mood vibe';
    const url = shareableVibeUrl(shareName, {
      mood,
      contentType,
      selectedGenres,
      selectedProviders,
      minRating,
      advancedFilters,
    });
    try {
      await copyToClipboard(url);
      pushToast({
        icon: '🔗',
        title: 'Vibe link copied',
        message: `Share "${shareName}" with anyone.`,
        duration: 3200,
      });
    } catch (err) {
      console.error('Share vibe failed:', err);
      pushToast({
        icon: '⚠️',
        title: 'Copy failed',
        message: 'Your browser blocked clipboard access.',
        variant: 'error',
        duration: 4000,
      });
    }
  }, [
    mood,
    contentType,
    selectedGenres,
    selectedProviders,
    minRating,
    advancedFilters,
    shareableVibeUrl,
    pushToast,
  ]);

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

  const activeTonightMode = useMemo(
    () => TONIGHT_MODES.find(mode => mode.id === tonightMode) || TONIGHT_MODES[0],
    [tonightMode]
  );

  const handleTonightModeSelect = useCallback(
    mode => {
      setTonightPreference('tonightMode', mode.id);
      setPassedDecisionIds([]);
      setLockedPickId('');
      if (!mood.trim()) {
        setMood(mode.mood);
      }
      setAdvancedFilters(prev => ({
        ...prev,
        ...mode.filters,
        yearMax: currentYear,
      }));
      setMinRating(prev => Math.max(prev, mode.minRating));
      playSound('pop');
    },
    [currentYear, mood, playSound, setAdvancedFilters, setMinRating, setMood, setTonightPreference]
  );

  const handleConstraintToggle = useCallback(
    constraint => {
      setActiveConstraintIds(prev => {
        const next = prev.includes(constraint.id)
          ? prev.filter(id => id !== constraint.id)
          : [...prev, constraint.id];
        return next;
      });

      if (constraint.id === 'under-90' || constraint.id === 'low-commitment') {
        setAdvancedFilters(prev => ({ ...prev, runtime: 'short' }));
      }
      if (constraint.id === 'high-rating' || constraint.id === 'hidden-gem') {
        setMinRating(prev => Math.max(prev, constraint.id === 'high-rating' ? 7 : 6.8));
        setAdvancedFilters(prev => ({ ...prev, sortBy: 'vote_average.desc' }));
      }
      if (constraint.id === 'newer') {
        setAdvancedFilters(prev => ({
          ...prev,
          yearMin: Math.max(prev.yearMin || 1900, currentYear - 5),
          yearMax: currentYear,
          sortBy: 'primary_release_date.desc',
        }));
      }
      if (constraint.id === 'classic') {
        setAdvancedFilters(prev => ({
          ...prev,
          yearMax: Math.min(prev.yearMax || currentYear, 2005),
          sortBy: 'vote_average.desc',
        }));
      }
      if (constraint.id === 'family-friendly') {
        setSelectedGenres(prev => (prev.includes(10751) ? prev : [...prev, 10751]));
      }
      if (constraint.id === 'no-horror') {
        setSelectedGenres(prev => prev.filter(genreId => genreId !== 27));
      }
      playSound('pop');
    },
    [
      currentYear,
      playSound,
      setActiveConstraintIds,
      setAdvancedFilters,
      setMinRating,
      setSelectedGenres,
    ]
  );

  const handleMoodPreset = useCallback(
    preset => {
      setMood(preset.mood);
      setActiveConstraintIds(preset.constraints);
      setPassedDecisionIds([]);
      setLockedPickId('');
      if (
        preset.constraints.includes('under-90') ||
        preset.constraints.includes('low-commitment')
      ) {
        setAdvancedFilters(prev => ({ ...prev, runtime: 'short' }));
      }
      if (preset.constraints.includes('high-rating')) {
        setMinRating(prev => Math.max(prev, 7));
      }
      if (preset.constraints.includes('no-horror')) {
        setSelectedGenres(prev => prev.filter(genreId => genreId !== 27));
      }
      playSound('pop');
      window.setTimeout(() => handleSearch(), 0);
    },
    [
      handleSearch,
      playSound,
      setActiveConstraintIds,
      setAdvancedFilters,
      setMinRating,
      setMood,
      setSelectedGenres,
    ]
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
    if (activeConstraintIds.length > 0) count++;
    return count;
  }, [selectedGenres, myServices, minRating, advancedFilters, currentYear, activeConstraintIds]);

  const activeConstraintLabels = useMemo(
    () =>
      activeConstraintIds
        .map(id => NIGHT_CONSTRAINTS.find(constraint => constraint.id === id)?.label)
        .filter(Boolean),
    [activeConstraintIds]
  );

  const featuredItem = useMemo(() => {
    const hasArtwork = item => Boolean(item?.backdrop_path || item?.poster_path);
    return (
      recommendations.find(hasArtwork) ||
      recommendations[0] ||
      trending.find(hasArtwork) ||
      trending[0] ||
      null
    );
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

  const tasteRecap = useMemo(() => {
    const topGenreId = Object.entries(watchlistGenreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topGenreName = genres.find(genre => String(genre.id) === String(topGenreId))?.name;
    const lastMood = recentMoods[0];
    const signals = [];
    if (topGenreName) signals.push(`saved ${topGenreName.toLowerCase()} titles`);
    if (tasteCounts.liked > 0) signals.push(`${tasteCounts.liked} liked picks`);
    if (lastMood) signals.push(`recent "${lastMood}" mood`);
    return signals.length > 0
      ? `MoodReel is using ${signals.slice(0, 3).join(', ')}.`
      : 'Save, rate, and mark watched titles to sharpen future picks.';
  }, [genres, recentMoods, tasteCounts.liked, watchlistGenreCounts]);

  // Destructure taste arrays for stable useMemo dependencies
  const { liked: likedKeys = [], disliked: dislikedKeys = [] } = profile || {};
  const tasteSettings = useMemo(() => safeGetJSON(TASTE_SETTINGS_KEY, TASTE_SETTING_DEFAULTS), []);

  const heroTitle = mood ? `Tuned for "${mood}"` : 'Find what to watch tonight.';

  const heroDescription = mood
    ? 'Your current vibe is shaping the feed. Refine the service, rating, or genre mix, then lock in a three-pick shortlist.'
    : 'Start with a feeling, add a few constraints, and let MoodReel collapse the catalog into Safe Bet, Best Match, and Wild Card.';

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
      return applySearchRanking(filtered, debouncedQuery, tieBreakers, selectedGenres, profile);
    }
    if (debouncedQuery && searchScope === 'all') {
      return applySearchRanking(
        searchResults,
        debouncedQuery,
        tieBreakers,
        selectedGenres,
        profile
      );
    }
    return filteredRecommendations;
  }, [
    filteredRecommendations,
    searchResults,
    debouncedQuery,
    searchScope,
    tieBreakers,
    selectedGenres,
    profile,
  ]);

  const rankedScorecards = useMemo(() => {
    const visibleResults = showHidden
      ? scopedResults
      : scopedResults.filter(
          item => statusFor(item.id, item.media_type || contentType) !== 'disliked'
        );
    const savedKeys = watchlist.map(item => getRecommendationKey(item, item.media_type || 'movie'));
    const watchedKeys = watchlist
      .filter(item => isWatched(item.id, item.media_type || 'movie'))
      .map(item => getRecommendationKey(item, item.media_type || 'movie'));
    const watchHistoryKeys = watchHistory
      .slice(0, 30)
      .map(item => getRecommendationKey(item, item.media_type || 'movie'));
    const providerDataByKey = visibleResults.reduce((acc, item) => {
      const mediaType = item.media_type || contentType;
      const providerKey = `${item.id}-${mediaType}-${region}`;
      acc[getRecommendationKey(item, mediaType)] =
        providerSnapshot[providerKey] || getCachedTitleProviders(item.id, mediaType, region);
      return acc;
    }, {});

    return rankRecommendations(visibleResults, {
      mode: activeTonightMode,
      constraints: activeConstraintIds,
      selectedGenres,
      providerDataByKey,
      myServices,
      likedKeys,
      dislikedKeys,
      savedKeys,
      watchedKeys,
      watchHistoryKeys,
      watchlistGenreCounts,
      tasteSettings,
      contentType,
      currentYear,
    });
  }, [
    scopedResults,
    showHidden,
    statusFor,
    contentType,
    region,
    watchHistory,
    likedKeys,
    dislikedKeys,
    tasteSettings,
    watchlist,
    isWatched,
    watchlistGenreCounts,
    activeTonightMode,
    activeConstraintIds,
    selectedGenres,
    providerSnapshot,
    myServices,
    currentYear,
  ]);

  const tasteAdjustedResults = useMemo(
    () => rankedScorecards.map(scorecard => scorecard.item),
    [rankedScorecards]
  );

  const scorecardByKey = useMemo(() => {
    return new Map(rankedScorecards.map(scorecard => [scorecard.key, scorecard]));
  }, [rankedScorecards]);

  const getProviderKey = useCallback(
    item => {
      return `${item.id}-${item.media_type || contentType}-${region}`;
    },
    [contentType, region]
  );

  const getRecommendationReason = useCallback(
    item => {
      const mediaType = item.media_type || contentType;
      const scorecard = scorecardByKey.get(getRecommendationKey(item, mediaType));
      if (scorecard?.explanation) return scorecard.explanation;
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
      scorecardByKey,
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

  const tonightPicks = useMemo(() => {
    const visibleKeys = new Set(
      filteredByServices.map(item => getRecommendationKey(item, item.media_type || contentType))
    );
    const visibleScorecards = rankedScorecards.filter(scorecard => visibleKeys.has(scorecard.key));
    return buildTonightPicks(visibleScorecards, {
      lockedPickId,
      passedKeys: passedDecisionIds,
    });
  }, [contentType, filteredByServices, lockedPickId, passedDecisionIds, rankedScorecards]);

  const decisionStats = useMemo(
    () => ({
      candidateCount: filteredByServices.length,
      pickCount: tonightPicks.length,
      passedCount: passedDecisionIds.length,
      serviceCount: myServices.length,
      topConfidence: tonightPicks[0]?.confidence || 0,
      lockedTitle:
        tonightPicks.find(
          pick =>
            getRecommendationKey(pick.item, pick.item.media_type || contentType) === lockedPickId
        )?.item || null,
    }),
    [
      contentType,
      filteredByServices.length,
      lockedPickId,
      myServices.length,
      passedDecisionIds.length,
      tonightPicks,
    ]
  );

  const handleDecisionPick = useCallback(
    item => {
      const key = getRecommendationKey(item, item.media_type || contentType);
      setLockedPickId(key);
      const added = addToWatchlist(item);
      if (added) trackSave(added);
      playSound('save');
      pushToast({
        icon: '🎬',
        title: "Tonight's pick locked",
        message: `${getReadableTitle(item)} ${added ? 'was saved to your watchlist.' : 'is already in your watchlist.'}`,
        duration: 3600,
      });
    },
    [addToWatchlist, contentType, playSound, pushToast, trackSave]
  );

  const handleDecisionFeedback = useCallback(
    (item, feedback) => {
      const mediaType = item.media_type || contentType;
      const key = getRecommendationKey(item, mediaType);
      setDecisionFeedback(prev => ({ ...prev, [key]: feedback.id }));
      setPassedDecisionIds(prev => (prev.includes(key) ? prev : [...prev, key]));

      if (feedback.id === 'too-long') {
        setActiveConstraintIds(prev =>
          Array.from(new Set([...prev, 'under-90', 'low-commitment']))
        );
        setAdvancedFilters(prev => ({ ...prev, runtime: 'short' }));
      }
      if (feedback.id === 'too-dark') {
        setActiveConstraintIds(prev => Array.from(new Set([...prev, 'no-horror'])));
        setSelectedGenres(prev => prev.filter(genreId => genreId !== 27));
      }
      if (feedback.id === 'seen-it') {
        toggleWatched(item.id, mediaType);
      }
      if (feedback.id === 'not-vibe') {
        dislike(item, mediaType);
      }
      if (feedback.id === 'need-lighter') {
        setMood('lighter fun comfort');
        setActiveConstraintIds(prev =>
          Array.from(new Set([...prev, 'low-commitment', 'no-horror']))
        );
      }
      if (feedback.id === 'more-obscure') {
        setActiveConstraintIds(prev => Array.from(new Set([...prev, 'hidden-gem', 'wild-card'])));
        setAdvancedFilters(prev => ({ ...prev, sortBy: 'vote_average.desc' }));
      }

      playSound('swipe');
      pushToast({
        icon: '🎚️',
        title: 'Taste adjusted',
        message: `${feedback.label} will shape the next three picks.`,
        duration: 2600,
      });
    },
    [
      contentType,
      dislike,
      playSound,
      pushToast,
      setActiveConstraintIds,
      setAdvancedFilters,
      setMood,
      setSelectedGenres,
      toggleWatched,
    ]
  );

  const handleDecisionPass = useCallback(
    item => {
      const key = getRecommendationKey(item, item.media_type || contentType);
      setLockedPickId(prev => (prev === key ? '' : prev));
      setPassedDecisionIds(prev => {
        const next = prev.includes(key) ? prev : [...prev, key];
        const resetThreshold = Math.min(Math.max(filteredByServices.length - 3, 3), 12);
        return next.length >= resetThreshold ? [] : next;
      });
      playSound('swipe');
    },
    [contentType, filteredByServices.length, playSound]
  );

  const handleDecisionReroll = useCallback(
    intent => {
      setPassedDecisionIds(prev =>
        Array.from(
          new Set([
            ...prev,
            ...tonightPicks.map(pick =>
              getRecommendationKey(pick.item, pick.item.media_type || contentType)
            ),
          ])
        )
      );
      setLockedPickId('');

      if (intent.id === 'shorter') {
        setActiveConstraintIds(prev =>
          Array.from(new Set([...prev, 'under-90', 'low-commitment']))
        );
        setAdvancedFilters(prev => ({ ...prev, runtime: 'short' }));
      }
      if (intent.id === 'lighter') {
        setMood('fun lighter comfort comedy');
        setActiveConstraintIds(prev =>
          Array.from(new Set([...prev, 'no-horror', 'low-commitment']))
        );
      }
      if (intent.id === 'stranger') {
        setActiveConstraintIds(prev => Array.from(new Set([...prev, 'wild-card', 'hidden-gem'])));
      }
      if (intent.id === 'acclaimed') {
        setActiveConstraintIds(prev => Array.from(new Set([...prev, 'high-rating'])));
        setMinRating(prev => Math.max(prev, 7.4));
      }
      if (intent.id === 'available') {
        setActiveConstraintIds(prev => Array.from(new Set([...prev, 'streaming-now'])));
      }

      playSound('pop');
      pushToast({
        icon: '🎲',
        title: 'Re-rolled with intent',
        message: `MoodReel is looking for: ${intent.label.toLowerCase()}.`,
        duration: 2600,
      });
    },
    [
      contentType,
      playSound,
      pushToast,
      setActiveConstraintIds,
      setAdvancedFilters,
      setMinRating,
      setMood,
      tonightPicks,
    ]
  );

  const handleShareTonight = useCallback(async () => {
    if (tonightPicks.length === 0) return;
    const lines = tonightPicks.map(
      pick =>
        `${pick.slotLabel}: ${getReadableTitle(pick.item)} (${pick.confidence || 0}% match) - ${pick.explanation}`
    );
    try {
      await copyToClipboard(`MoodReel picked tonight:\n${lines.join('\n')}`);
      pushToast({
        icon: '🔗',
        title: 'Tonight card copied',
        message: 'The three-pick decision card is ready to share.',
        duration: 2600,
      });
    } catch {
      pushToast({
        icon: '⚠️',
        title: 'Copy failed',
        message: 'Clipboard access was blocked by the browser.',
        variant: 'error',
        duration: 3600,
      });
    }
  }, [pushToast, tonightPicks]);

  const handleSmartSurprise = useCallback(() => {
    const avoidKeys = [
      ...(profile?.liked || []),
      ...(profile?.disliked || []),
      ...watchHistory.slice(0, 30).map(item => `${item.id}-${item.media_type || 'movie'}`),
    ];
    const artworkCandidates = filteredByServices.filter(
      item => item?.poster_path || item?.backdrop_path
    );
    const fallbackArtworkCandidates = recommendations.filter(
      item => item?.poster_path || item?.backdrop_path
    );
    handleSurpriseMe({
      candidates:
        artworkCandidates.length > 0
          ? artworkCandidates
          : fallbackArtworkCandidates.length > 0
            ? fallbackArtworkCandidates
            : trending,
      avoidKeys,
    });
  }, [filteredByServices, handleSurpriseMe, profile, recommendations, trending, watchHistory]);

  useEffect(() => {
    setIsWinnerOverlayOpen(Boolean(showWinnerInfo));
  }, [showWinnerInfo, surpriseMovie?.id, surpriseMovie?.media_type]);

  const handleShuffleDismiss = useCallback(() => {
    if (showWinnerInfo) {
      setIsWinnerOverlayOpen(false);
      return;
    }

    closeSurprise();
  }, [closeSurprise, showWinnerInfo]);

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
        isWinner={showWinnerInfo && isWinnerOverlayOpen}
        winnerItem={surpriseMovie}
        results={trending.length > 0 ? trending : recommendations}
        onDismiss={handleShuffleDismiss}
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
          primaryActionLabel="Find Tonight's Picks"
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

        <HomeTonightSetup
          activeTonightMode={activeTonightMode}
          tonightMode={tonightMode}
          activeConstraintIds={activeConstraintIds}
          activeConstraintLabels={activeConstraintLabels}
          decisionStats={decisionStats}
          myServices={myServices}
          tasteRecap={tasteRecap}
          onTonightModeSelect={handleTonightModeSelect}
          onConstraintToggle={handleConstraintToggle}
          onMoodPreset={handleMoodPreset}
          onToggleService={toggleService}
        />

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

      <ContinueWatchingStrip
        history={watchHistoryEntries}
        hasAnySearch={hasAnySearch}
        isInWatchlist={isInWatchlist}
        toggleWatchlist={toggleWatchlist}
        isWatched={isWatched}
        toggleWatched={toggleWatched}
        like={like}
        dislike={dislike}
        statusFor={statusFor}
      />

      <OnMyServicesStrip
        recommendations={recommendations}
        hasAnySearch={hasAnySearch}
        myServices={myServices}
        providerSnapshot={providerSnapshot}
        getProviderKey={getProviderKey}
        contentType={contentType}
        region={region}
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
        featuredItem={featuredItem}
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
        handleShareVibe={handleShareVibe}
        scheduleVibeUrl={
          hasAnySearch
            ? shareableVibeUrl(
                mood ? `${mood.charAt(0).toUpperCase()}${mood.slice(1)} vibe` : 'MoodReel vibe',
                {
                  mood,
                  contentType,
                  selectedGenres,
                  selectedProviders,
                  minRating,
                  advancedFilters,
                }
              )
            : ''
        }
        setMood={setMood}
        handleClearFilters={handleClearFilters}
        hasMore={hasMore}
        isLoading={isLoading}
        loadMoreResults={loadMoreResults}
        searchScope={searchScope}
        loadMoreRef={loadMoreRef}
        activeTonightMode={activeTonightMode}
        tonightPicks={tonightPicks}
        lockedPickId={lockedPickId}
        activeConstraintLabels={activeConstraintLabels}
        decisionStats={decisionStats}
        decisionFeedback={decisionFeedback}
        decisionFeedbackOptions={DECISION_FEEDBACK}
        rerollOptions={REROLL_INTENTS}
        myServicesCount={myServices.length}
        onPickCandidate={handleDecisionPick}
        onPassCandidate={handleDecisionPass}
        onFeedbackCandidate={handleDecisionFeedback}
        onRerollCandidate={handleDecisionReroll}
        onShareTonight={handleShareTonight}
      />
    </main>
  );
}

export default Home;
