import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import SwipeCard from '../components/SwipeCard';
import EmojiPicker from '../components/EmojiPicker';
import StreamingFilter from '../components/StreamingFilter';
import RatingFilter from '../components/RatingFilter';
import AdvancedFilters from '../components/AdvancedFilters';
import MoodPlaylists from '../components/MoodPlaylists';
import MoodPulse from '../components/MoodPulse';
import ShuffleOverlay from '../components/ShuffleOverlay';
import FilterSummary from '../components/FilterSummary';
import { SkeletonGrid, MovieCardSkeleton, DiscoveryHeroSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAchievements } from '../hooks/useAchievements';
import { useMoodHistory } from '../hooks/useMoodHistory';
import { useCustomPlaylists } from '../hooks/useCustomPlaylists';
import { useSounds } from '../hooks/useSounds';
import { useMovieDiscovery } from '../hooks/useMovieDiscovery';
import { useContinuousDiscovery } from '../hooks/useContinuousDiscovery';
import { useWindowSize } from '../hooks/useWindowSize';
import { useProviderSettings } from '../hooks/useProviderSettings';
import { useTasteProfile } from '../hooks/useTasteProfile';
import { useToasts } from '../context/ToastContext';
import searchService from '../services/searchService';
import {
  fetchProviderCatalog,
  fetchTitleProviders,
  getCachedTitleProviders,
} from '../services/providerService';
import { applySearchRanking } from '../utils/searchRanking';
import { buildDiscoveryParams } from '../utils/searchContext';
import { copyToClipboard } from '../utils/clipboard';
import {
  getBackdropUrl,
  getDisplayTitle,
  getDisplayOverview,
  getReleaseYear,
} from '../utils/mediaUtils';
import { shouldSkipLog, isAbortError, getUserFacingMessage } from '../services/apiErrorUtils';

function Home() {
  const currentYear = new Date().getFullYear();
  const { isMobile } = useWindowSize();
  const location = useLocation();
  const { playSound } = useSounds();
  const { isInWatchlist, toggleWatchlist, addToWatchlist, isWatched, toggleWatched } =
    useWatchlist();
  const { trackSave, trackSurprise } = useAchievements();
  const { history: recentMoods, addToHistory } = useMoodHistory();
  const { savePlaylist } = useCustomPlaylists();
  const { region, setRegion, myServices, setMyServices, toggleService } = useProviderSettings();
  const { like, dislike, statusFor, showHidden, setShowHidden, tasteCounts } = useTasteProfile();
  const { pushToast } = useToasts();

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
    setMatchType,
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
  const [shuffleLocked, setShuffleLocked] = useState(false);
  const [titleQuery, setTitleQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchScope, setSearchScope] = useState('within');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [isSearchingAll, setIsSearchingAll] = useState(false);
  const [providerSnapshot, setProviderSnapshot] = useState({});
  const [providerCatalog, setProviderCatalog] = useState([]);
  const [resultLayout, setResultLayout] = useState('poster');
  const loadMoreRef = useRef(null);
  const searchControllerRef = useRef(null);
  const hasHydratedRef = useRef(false);
  const moodInputRef = useRef(null);
  const titleSearchRef = useRef(null);

  const discoveryParams = useMemo(
    () =>
      buildDiscoveryParams({
        mood,
        contentType,
        selectedGenres,
        selectedProviders,
        minRating,
        matchType,
        region,
        advancedFilters,
      }),
    [
      mood,
      contentType,
      selectedGenres,
      selectedProviders,
      minRating,
      matchType,
      region,
      advancedFilters,
    ]
  );

  const getSearchParams = useCallback(() => discoveryParams, [discoveryParams]);

  const {
    isShuffling,
    shufflePick,
    shuffleCount,
    startShuffle,
    stopShuffle,
    shuffleAgain,
    isExploring,
    startExplore,
    stopExplore,
  } = useContinuousDiscovery({ getSearchParams, trackSurprise });

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
      setTimeout(() => handleSearch(), 0);
    }
  }, [
    location.search,
    handleSearch,
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

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 12);
          loadMoreResults();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
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

  const handleSurpriseMe = useCallback(() => {
    if (isShuffling) return;
    playSound('click');
    if (navigator.vibrate) navigator.vibrate(20);
    setShuffleLocked(false);
    startShuffle();
  }, [isShuffling, playSound, startShuffle]);

  const handleLockShuffle = useCallback(() => {
    stopShuffle();
    setShuffleLocked(true);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  }, [stopShuffle]);

  const handleKeepShuffling = useCallback(() => {
    setShuffleLocked(false);
    shuffleAgain();
  }, [shuffleAgain]);

  const closeSurprise = useCallback(() => {
    stopShuffle();
    setShuffleLocked(false);
  }, [stopShuffle]);

  const handleToggleExplore = useCallback(() => {
    if (isExploring) {
      stopExplore();
      return;
    }
    startExplore({
      loadMore: loadMoreResults,
      hasMore: () => hasMore,
      canLoad: () => hasSearched && searchScope !== 'all',
    });
  }, [isExploring, stopExplore, startExplore, loadMoreResults, hasMore, hasSearched, searchScope]);

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

  const handleSaveVibe = useCallback(() => {
    if (!mood && selectedGenres.length === 0) return;
    const name = prompt("Name your custom vibe (e.g. 'Late Night Thrills'):");
    if (name) {
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
    }
  }, [
    mood,
    contentType,
    selectedGenres,
    selectedProviders,
    minRating,
    advancedFilters,
    savePlaylist,
    playSound,
    pushToast,
  ]);

  const handleClearFilters = useCallback(() => {
    setSelectedGenres([]);
    setMinRating(0);
    setMatchType('all');
    setAdvancedFilters({
      yearMin: 1900,
      yearMax: currentYear,
      sortBy: 'popularity.desc',
      runtime: 'any',
    });
    playSound('pop');
  }, [setSelectedGenres, setMinRating, setMatchType, setAdvancedFilters, currentYear, playSound]);

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
    return [...results].sort((a, b) => {
      const aStatus = statusFor(a.id, a.media_type || contentType);
      const bStatus = statusFor(b.id, b.media_type || contentType);
      if (aStatus === bStatus) return 0;
      if (aStatus === 'liked') return -1;
      if (bStatus === 'liked') return 1;
      if (aStatus === 'disliked') return 1;
      if (bStatus === 'disliked') return -1;
      return 0;
    });
  }, [scopedResults, showHidden, statusFor, contentType]);

  const getProviderKey = useCallback(
    item => {
      return `${item.id}-${item.media_type || contentType}-${region}`;
    },
    [contentType, region]
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
    <main className="page-enter">
      <ShuffleOverlay
        isActive={isShuffling}
        isLocked={shuffleLocked}
        currentPick={shufflePick}
        shuffleCount={shuffleCount}
        results={trending.length > 0 ? trending : recommendations}
        onStop={handleLockShuffle}
        onShuffleAgain={handleKeepShuffling}
        onDismiss={closeSurprise}
      />

      {shuffleLocked && shufflePick && (
        <div
          className="surprise-banner"
          role="button"
          tabIndex={0}
          onClick={closeSurprise}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              closeSurprise();
            }
          }}
          aria-label={`Surprise pick: ${shufflePick.title || shufflePick.name}. Press Enter to dismiss.`}
        >
          <span className="surprise-icon" aria-hidden="true">
            🎉
          </span>
          <div className="surprise-content">
            <p>We found a gem for you!</p>
            <h3>{shufflePick.title || shufflePick.name}</h3>
          </div>
          <div className="surprise-actions">
            <Link
              to={`/${shufflePick.media_type || 'movie'}/${shufflePick.id}`}
              className="surprise-link primary"
              onClick={e => e.stopPropagation()}
            >
              Watch Now
            </Link>
            <button
              className="surprise-link secondary"
              onClick={e => {
                e.stopPropagation();
                closeSurprise();
              }}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isLoading && !featuredItem ? (
        <DiscoveryHeroSkeleton />
      ) : (
        <section className="discovery-hero">
          <div className="discovery-hero-copy">
            <span className="hero-kicker">MoodReel / discovery engine</span>
            <h2>{heroTitle}</h2>
            <p className="hero-description">{heroDescription}</p>
            <div className="hero-proof-row">
              <span className="hero-proof">Mood: {heroMoodLabel}</span>
              <span className="hero-proof">
                {selectedGenres.length > 0 ? `${selectedGenres.length} genres` : 'All genres'}
              </span>
              <span className="hero-proof">
                {myServices.length > 0 ? `${myServices.length} services` : 'Any service'}
              </span>
              <span className="hero-proof">{activeFilterCount} filters</span>
            </div>
            <div className="hero-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  if (!mood) {
                    setMood(timeContext.suggestion);
                    window.setTimeout(() => handleSearch(), 0);
                    return;
                  }
                  handleSearch();
                }}
              >
                {mood ? 'Search this mood' : `Try “${timeContext.suggestion}”`}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSurpriseMe}
                disabled={isShuffling}
              >
                {isShuffling ? 'Shuffling…' : 'Surprise Me'}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => window.dispatchEvent(new CustomEvent('moodreel:focus-mood-search'))}
              >
                Focus search
              </button>
            </div>
            <p className="hero-hint">
              Press <kbd>⌘</kbd> <kbd>K</kbd> for the quick-action palette.
            </p>
          </div>

          <div className="discovery-hero-visual">
            {featuredItem ? (
              <Link to={featuredLink} className="hero-featured-card">
                <div className="hero-featured-art">
                  <img
                    src={getBackdropUrl(featuredItem.backdrop_path, 'w780')}
                    alt={getDisplayTitle(featuredItem)}
                    loading="eager"
                    decoding="async"
                  />
                  <div className="hero-featured-overlay" />
                </div>
                <div className="hero-featured-copy">
                  <span className="hero-featured-eyebrow">
                    {hasAnySearch ? 'Current spotlight' : 'Trending spotlight'}
                  </span>
                  <h3>{getDisplayTitle(featuredItem)}</h3>
                  <p>{getDisplayOverview(featuredItem)}</p>
                  <div className="hero-featured-meta">
                    {getReleaseYear(featuredItem) && <span>{getReleaseYear(featuredItem)}</span>}
                    {featuredItem.vote_average ? (
                      <span>{featuredItem.vote_average.toFixed(1)} / 10</span>
                    ) : null}
                    <span>{featuredItem.media_type === 'tv' ? 'Series' : 'Film'}</span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="hero-featured-card hero-featured-card-empty">
                <span className="hero-featured-eyebrow">Loading spotlight</span>
                <h3>MoodReel is finding a fit</h3>
                <p>The featured pick will appear as soon as the discovery feed lands.</p>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="discovery-support-grid">
        <div className="discovery-support-column">
          <div className="hero-vibe-bar glass-panel">
            <div className="vibe-greeting">
              <span className="vibe-emoji">{timeContext.emoji}</span>
              <div className="vibe-text">
                <span className="vibe-label">{timeContext.greeting}</span>
                <button
                  className="vibe-suggestion"
                  type="button"
                  onClick={() => {
                    setMood(timeContext.suggestion);
                    playSound('pop');
                  }}
                >
                  Try <span className="text-gold">"{timeContext.suggestion}"</span>
                </button>
              </div>
            </div>
            <div className="hero-actions">
              <button
                className={`surprise-pill ${isShuffling ? 'shuffle-anim' : ''}`}
                type="button"
                onClick={handleSurpriseMe}
                disabled={isShuffling}
              >
                {isShuffling ? '🎲 Shuffling…' : '🔥 Surprise Me'}
              </button>
            </div>
          </div>

          <div className="discovery-insights glass-panel">
            <span className="insight-kicker">Quick glance</span>
            <div className="insight-grid">
              <div className="insight-item">
                <span>Current mood</span>
                <strong>{mood || timeContext.suggestion}</strong>
              </div>
              <div className="insight-item">
                <span>Recent mood</span>
                <strong>{recentMoods[0] || 'None yet'}</strong>
              </div>
              <div className="insight-item">
                <span>Services</span>
                <strong>{myServices.length > 0 ? `${myServices.length} selected` : 'Any'}</strong>
              </div>
              <div className="insight-item">
                <span>Filters</span>
                <strong>{activeFilterCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {!hasAnySearch && <MoodPulse />}
      </div>

      {trending.length > 0 && recommendations.length === 0 && !hasAnySearch && (
        <section className="trending-section">
          <h2>🔥 Trending Now</h2>
          <div className="recommendations">
            {trending.map((item, idx) => (
              <MovieCard
                key={item.id}
                movie={item}
                isInWatchlist={isInWatchlist(item.id)}
                onToggleWatchlist={toggleWatchlist}
                isWatched={isWatched(item.id)}
                onToggleWatched={toggleWatched}
                mediaType={item.media_type}
                providerBadges={
                  (
                    providerSnapshot[getProviderKey(item)] ||
                    getCachedTitleProviders(item.id, item.media_type, region)
                  )?.flatrate?.slice(0, 3) || []
                }
                onLike={like}
                onDislike={dislike}
                tasteStatus={statusFor(item.id, item.media_type)}
                index={idx}
              />
            ))}
          </div>
        </section>
      )}

      <section className="discovery-console">
        <div className="content-toggle-tabs" role="group" aria-label="Content type">
          {['all', 'movie', 'tv'].map(type => (
            <button
              key={type}
              type="button"
              className={`content-tab ${contentType === type ? 'active' : ''}`}
              aria-pressed={contentType === type}
              onClick={() => {
                setContentType(type);
                setRecommendations([]);
                setHasSearched(false);
              }}
            >
              {type === 'all' ? '🎬 All' : type === 'movie' ? '🎥 Movies' : '📺 TV'}
            </button>
          ))}
        </div>

        <div className="result-layout-toggle" role="group" aria-label="Result layout">
          <button
            type="button"
            className={`result-layout-btn ${resultLayout === 'poster' ? 'active' : ''}`}
            onClick={() => setResultLayout('poster')}
          >
            🎞 Poster Grid
          </button>
          <button
            type="button"
            className={`result-layout-btn ${resultLayout === 'rows' ? 'active' : ''}`}
            onClick={() => setResultLayout('rows')}
          >
            📜 Cinematic List
          </button>
        </div>

        <div className="mood-selector">
          <label htmlFor="mood-search-input" className="mood-input-label">
            How are you feeling?
          </label>
          <div className="mood-input-wrapper">
            <span className="mood-icon" aria-hidden="true">
              ✨
            </span>
            <input
              id="mood-search-input"
              ref={moodInputRef}
              type="text"
              value={mood}
              onChange={e => setMood(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="What's your mood tonight?"
            />
            {mood && (
              <button
                type="button"
                className="mood-clear-btn"
                onClick={() => setMood('')}
                aria-label="Clear mood"
              >
                ✕
              </button>
            )}
          </div>
          {recentMoods.length > 0 && !mood && (
            <div className="recent-moods">
              <span className="recent-moods-label">Recent:</span>
              {recentMoods.slice(0, 5).map((recentMood, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="recent-mood-chip"
                  onClick={() => {
                    setMood(recentMood);
                    playSound('pop');
                  }}
                >
                  {recentMood}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="title-search">
          <label htmlFor="title-search-input">Search titles</label>
          <input
            ref={titleSearchRef}
            id="title-search-input"
            type="text"
            value={titleQuery}
            onChange={e => setTitleQuery(e.target.value)}
            placeholder="Search movies or TV"
          />
          <div className="search-scope-toggle" role="group" aria-label="Search scope">
            <button
              type="button"
              className={searchScope === 'within' ? 'active' : ''}
              onClick={() => setSearchScope('within')}
              aria-pressed={searchScope === 'within'}
            >
              Search within mood results
            </button>
            <button
              type="button"
              className={searchScope === 'all' ? 'active' : ''}
              onClick={() => setSearchScope('all')}
              aria-pressed={searchScope === 'all'}
            >
              Search all
            </button>
          </div>
        </div>

        <div className="search-container">
          <button className="primary-button" type="button" onClick={handleSearch} disabled={isBusy}>
            {isBusy ? 'Searching…' : 'Get Recommendations'}
          </button>
          <button
            className="secondary-button"
            type="button"
            aria-label="Copy shareable link"
            onClick={async () => {
              try {
                await copyToClipboard(window.location.href);
                pushToast({
                  icon: '🔗',
                  title: 'Link copied',
                  message: 'Shareable link copied to clipboard.',
                  duration: 2600,
                });
              } catch (err) {
                console.error('Copy link failed:', err);
                pushToast({
                  icon: '⚠️',
                  title: 'Copy failed',
                  message: 'Your browser blocked clipboard access.',
                  variant: 'error',
                  duration: 4000,
                });
              }
            }}
          >
            🔗 Copy Link
          </button>
        </div>

        <EmojiPicker onSelect={handleEmojiSelect} selectedGenres={selectedGenres} />

        {recommendations.length === 0 && !isLoading && (
          <MoodPlaylists
            onSelectPlaylist={({ genres, name, customFilters }) => {
              if (customFilters) {
                setMood(customFilters.mood || '');
                setContentType(customFilters.contentType || 'all');
                setSelectedGenres(customFilters.selectedGenres || []);
                setSelectedProviders(customFilters.selectedProviders || []);
                setMinRating(customFilters.minRating || 0);
                setAdvancedFilters(customFilters.advancedFilters || {});
              } else {
                setSelectedGenres(genres);
                setMood(name);
              }
              setTimeout(() => handleSearch(), 0);
            }}
          />
        )}

        <FilterSummary
          mood={mood}
          selectedGenres={selectedGenres}
          selectedProviders={selectedProviders}
          providerCatalog={providerCatalog}
          minRating={minRating}
          matchType={matchType}
          contentType={contentType}
          advancedFilters={advancedFilters}
          myServices={myServices}
        />

        <button
          className="filters-toggle"
          type="button"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? '✕ Hide Filters' : '⚙️ Filter & Sort'}
          {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
        </button>

        {showFilters && (
          <div className={`filters-wrapper ${activeFilterCount > 0 ? 'has-filters' : ''}`}>
            <div className="genre-match-toggle" role="group" aria-label="Category match mode">
              <span className="genre-match-label">Categories match:</span>
              <button
                type="button"
                className={matchType === 'all' ? 'active' : ''}
                aria-pressed={matchType === 'all'}
                onClick={() => setMatchType('all')}
              >
                All (AND)
              </button>
              <button
                type="button"
                className={matchType === 'any' ? 'active' : ''}
                aria-pressed={matchType === 'any'}
                onClick={() => setMatchType('any')}
              >
                Any (OR)
              </button>
            </div>
            <div className="genre-filters">
              <h3>Genres:</h3>
              <div className="genre-buttons">
                {genres.map(genre => (
                  <button
                    key={genre.id}
                    type="button"
                    className={selectedGenres.includes(genre.id) ? 'active' : ''}
                    onClick={() => handleGenreClick(genre.id)}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
            <StreamingFilter
              selectedProviders={selectedProviders}
              onToggle={handleProviderToggle}
              providers={providerCatalog.length > 0 ? providerCatalog : undefined}
              label="My Services"
            />
            <RatingFilter minRating={minRating} onRatingChange={setMinRating} />
            <AdvancedFilters filters={advancedFilters} onFiltersChange={setAdvancedFilters} />
            <div className="filter-actions" style={{ gridColumn: 'span 2', textAlign: 'center' }}>
              <button className="text-button" type="button" onClick={handleClearFilters}>
                🧹 Clear All Filters
              </button>
            </div>
          </div>
        )}
      </section>

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

      <div aria-live="polite">
        {isBusy && filteredByServices.length === 0 ? (
          <SkeletonGrid count={8} />
        ) : isMobile && hasAnySearch && filteredByServices.length > 0 ? (
          <div className="swipe-container" style={{ textAlign: 'center' }}>
            {isCardLoading ? (
              <MovieCardSkeleton />
            ) : (
              <SwipeCard
                movie={filteredByServices[0]}
                nextMovie={filteredByServices[1]}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                mediaType={filteredByServices[0]?.media_type}
              />
            )}
          </div>
        ) : (
          <div className="recommendations-container">
            {filteredByServices.length > 0 && (
              <div className="results-header">
                <div className="results-meta">
                  <h2>
                    Results <span className="results-count">{filteredByServices.length}</span>
                  </h2>
                  <div className="results-meta-row">
                    {(tasteCounts.liked > 0 || tasteCounts.disliked > 0) && (
                      <div className="taste-summary">
                        {tasteCounts.liked > 0 && (
                          <span className="taste-liked">👍 {tasteCounts.liked}</span>
                        )}
                        {tasteCounts.disliked > 0 && (
                          <span className="taste-disliked">👎 {tasteCounts.disliked}</span>
                        )}
                      </div>
                    )}
                    <label className="show-hidden-toggle">
                      <input
                        type="checkbox"
                        checked={showHidden}
                        onChange={e => setShowHidden(e.target.checked)}
                      />
                      Show hidden
                    </label>
                  </div>
                </div>
                <div className="results-header-actions">
                  {hasMore && searchScope !== 'all' && (
                    <button
                      type="button"
                      className={`btn-secondary btn-sm explore-toggle ${isExploring ? 'active' : ''}`}
                      onClick={handleToggleExplore}
                      aria-pressed={isExploring}
                    >
                      {isExploring ? '⏸ Stop exploring' : '▶ Keep exploring'}
                    </button>
                  )}
                  <button className="btn-secondary btn-sm save-vibe-btn" onClick={handleSaveVibe}>
                    ✨ Save Vibe
                  </button>
                </div>
              </div>
            )}
            <div
              className={`recommendations ${resultLayout === 'rows' ? 'recommendations-list-mode' : ''}`}
            >
              {filteredByServices.slice(0, visibleCount).map((rec, idx) => (
                <MovieCard
                  key={rec.id}
                  movie={rec}
                  displayMode={resultLayout === 'rows' ? 'row' : 'poster'}
                  isInWatchlist={isInWatchlist(rec.id)}
                  onToggleWatchlist={toggleWatchlist}
                  isWatched={isWatched(rec.id)}
                  onToggleWatched={toggleWatched}
                  mediaType={rec.media_type}
                  providerBadges={
                    (
                      providerSnapshot[getProviderKey(rec)] ||
                      getCachedTitleProviders(rec.id, rec.media_type, region)
                    )?.flatrate?.slice(0, 3) || []
                  }
                  onLike={like}
                  onDislike={dislike}
                  tasteStatus={statusFor(rec.id, rec.media_type)}
                  index={idx}
                />
              ))}
              {hasAnySearch && !isBusy && filteredByServices.length === 0 && (
                <EmptyState
                  icon="✨"
                  title="No results found"
                  description="Try a different mood or clear your filters!"
                  onActionClick={() => setMood('')}
                  actionText="Clear Search"
                />
              )}
            </div>
          </div>
        )}

        {hasMore && !isMobile && searchScope !== 'all' && (
          <div ref={loadMoreRef} className="load-more-indicator">
            {isLoading ? (
              <>
                <span className="loading-spinner lg"></span>
                <span>Loading more...</span>
              </>
            ) : (
              <button className="btn-secondary" onClick={loadMoreResults}>
                Load More
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default Home;
