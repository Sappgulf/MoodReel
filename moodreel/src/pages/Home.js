import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
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
import { SkeletonGrid, MovieCardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAchievements } from '../hooks/useAchievements';
import { useMoodHistory } from '../hooks/useMoodHistory';
import { useCustomPlaylists } from '../hooks/useCustomPlaylists';
import { useSounds } from '../hooks/useSounds';
import { useMovieDiscovery } from '../hooks/useMovieDiscovery';
import { useWindowSize } from '../hooks/useWindowSize';
import { useProviderSettings } from '../hooks/useProviderSettings';
import { useTasteProfile } from '../hooks/useTasteProfile';
import { useToasts } from '../context/ToastContext';
import searchService from '../services/searchService';
import { fetchProviderCatalog, fetchTitleProviders, getCachedTitleProviders } from '../services/providerService';
import { applySearchRanking } from '../utils/searchRanking';
import { copyToClipboard } from '../utils/clipboard';

function Home() {
  const currentYear = new Date().getFullYear();
  const { isMobile } = useWindowSize();
  const location = useLocation();
  const { playSound } = useSounds();
  const { isInWatchlist, toggleWatchlist, addToWatchlist, isWatched, toggleWatched } = useWatchlist();
  const { trackSave } = useAchievements();
  const { history: recentMoods, addToHistory } = useMoodHistory();
  const { savePlaylist } = useCustomPlaylists();
  const { region, setRegion, myServices, setMyServices, toggleService } = useProviderSettings();
  const { like, dislike, statusFor, showHidden, setShowHidden, tasteCounts } = useTasteProfile();
  const { pushToast } = useToasts();

  const {
    mood, setMood,
    recommendations, setRecommendations,
    trending,
    error,
    selectedGenres, setSelectedGenres,
    selectedProviders, setSelectedProviders,
    isLoading,
    contentType, setContentType,
    matchType,
    hasMore,
    minRating, setMinRating,
    hasSearched, setHasSearched,
    advancedFilters, setAdvancedFilters,
    fetchTrending,
    search: getRecommendations,
    loadMore: loadMoreResults
  } = useMovieDiscovery(currentYear, region);

  const [visibleCount, setVisibleCount] = useState(8);

  const [genres, setGenres] = useState([]);
  const [isCardLoading, setIsCardLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);
  const [surpriseMovie, setSurpriseMovie] = useState(null);
  const [titleQuery, setTitleQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchScope, setSearchScope] = useState('within');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [isSearchingAll, setIsSearchingAll] = useState(false);
  const [providerSnapshot, setProviderSnapshot] = useState({});
  const [providerCatalog, setProviderCatalog] = useState([]);

  const loadMoreRef = useRef(null);
  const searchControllerRef = useRef(null);
  const hasHydratedRef = useRef(false);

  const handleSearch = useCallback(() => {
    if (mood) addToHistory(mood);
    setVisibleCount(8); // Reset staggered visibility
    getRecommendations();
  }, [mood, addToHistory, getRecommendations]);

  useEffect(() => {
    setSelectedProviders(myServices);
  }, [myServices, setSelectedProviders]);

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
      setAdvancedFilters((prev) => ({
        ...prev,
        yearMin: yearMinParam ? parseInt(yearMinParam, 10) : prev.yearMin,
        yearMax: yearMaxParam ? parseInt(yearMaxParam, 10) : prev.yearMax
      }));
      if (ratingParam) setMinRating(parseFloat(ratingParam));
    }

    if (servicesParam) {
      const ids = servicesParam.split(',').map((id) => parseInt(id, 10)).filter(Boolean);
      setMyServices(ids);
    }

    if (showHiddenParam) {
      setShowHidden(showHiddenParam === 'true');
    }

    hasHydratedRef.current = true;

    if (moodParam) {
      setTimeout(() => handleSearch(), 0);
    }
  }, [location.search, handleSearch, setAdvancedFilters, setContentType, setMinRating, setMood, setMyServices, setRegion, setSearchScope, setShowHidden]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    const params = new URLSearchParams();

    if (mood) params.set('mood', mood);
    if (titleQuery) params.set('query', titleQuery);
    if (contentType && contentType !== 'all') params.set('type', contentType);
    if (advancedFilters.yearMin && advancedFilters.yearMin > 1900) params.set('yearMin', advancedFilters.yearMin);
    if (advancedFilters.yearMax && advancedFilters.yearMax < currentYear) params.set('yearMax', advancedFilters.yearMax);
    if (minRating > 0) params.set('rating', minRating);
    if (region && region !== 'US') params.set('region', region);
    if (myServices.length > 0) params.set('services', myServices.join(','));
    if (searchScope !== 'within') params.set('scope', searchScope);
    if (showHidden) params.set('showHidden', 'true');

    const queryString = params.toString();
    const nextUrl = `${location.pathname}${queryString ? `?${queryString}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, [mood, titleQuery, contentType, advancedFilters, minRating, region, myServices, searchScope, showHidden, location.pathname, currentYear]);


  // Dynamic Mood Themes
  useEffect(() => {
    const body = document.body;
    body.classList.remove('mood-romantic', 'mood-thriller', 'mood-happy', 'mood-classic');

    if (!mood) return;

    const moodLower = mood.toLowerCase();
    if (moodLower.includes('romance') || moodLower.includes('love') || moodLower.includes('date')) {
      body.classList.add('mood-romantic');
    } else if (moodLower.includes('thrill') || moodLower.includes('scary') || moodLower.includes('horror') || moodLower.includes('dark')) {
      body.classList.add('mood-thriller');
    } else if (moodLower.includes('happy') || moodLower.includes('uplift') || moodLower.includes('fun') || moodLower.includes('comedy')) {
      body.classList.add('mood-happy');
    } else if (moodLower.includes('classic') || moodLower.includes('old') || moodLower.includes('noir') || moodLower.includes('retro')) {
      body.classList.add('mood-classic');
    }

    return () => body.classList.remove('mood-romantic', 'mood-thriller', 'mood-happy', 'mood-classic');
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

  const performAllSearch = useCallback(async (query, controller) => {
    try {
      const result = await searchService.search({
        query,
        type: contentType,
        genres: [],
        providers: selectedProviders,
        minRating,
        matchType,
        region,
        ...advancedFilters,
        page: 1,
        multiPage: true
      }, controller.signal);

      if (result.error) {
        setSearchError(result.error);
      }
      setSearchResults(result.results || []);
    } catch (err) {
      if (!axios.isCancel(err)) {
        setSearchError('Search failed. Please try again.');
      }
    } finally {
      setIsSearchingAll(false);
    }
  }, [contentType, selectedProviders, minRating, matchType, region, advancedFilters]);

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
        if (err.name !== 'AbortError') console.error('Error fetching genres:', err);
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
          fetchProviderCatalog('tv', region, controller.signal)
        ]);
        const merged = [...movieProviders, ...tvProviders].reduce((acc, provider) => {
          if (!acc.some((p) => p.id === provider.id)) {
            acc.push(provider);
          }
          return acc;
        }, []);
        setProviderCatalog(merged);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching provider catalog:', err);
        }
      }
    };
    loadProviders();
    return () => controller.abort();
  }, [region]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 12);
          loadMoreResults();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMoreResults]);

  const handleGenreClick = useCallback((genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  }, [setSelectedGenres]);

  const handleProviderToggle = useCallback((providerId) => {
    toggleService(providerId);
  }, [toggleService]);

  const handleEmojiSelect = useCallback((emojiMood) => {
    setMood(emojiMood.keyword);
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      emojiMood.genres.forEach((genreId) => next.add(genreId));
      return Array.from(next);
    });
  }, [setMood, setSelectedGenres]);

  const handleSurpriseMe = useCallback(async () => {
    if (isSurpriseLoading) return;
    playSound('click');
    if (navigator.vibrate) navigator.vibrate(20);
    setIsSurpriseLoading(true);
    // Shuffle duration
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      const randomPick = await searchService.fetchRandomDiscovery();
      if (randomPick) {
        setSurpriseMovie(randomPick);
        setTimeout(() => setSurpriseMovie(null), 10000);
      }
    } catch (err) {
      console.error('Surprise me failed:', err);
    } finally {
      setIsSurpriseLoading(false);
    }
  }, [isSurpriseLoading, playSound]);

  const handleSwipeRight = useCallback((movie) => {
    setIsCardLoading(true);
    playSound('save');
    const added = addToWatchlist(movie);
    if (added) trackSave(added);
    setRecommendations(prev => prev.filter(m => m.id !== movie.id));
    setTimeout(() => setIsCardLoading(false), 300);
  }, [addToWatchlist, trackSave, playSound, setRecommendations]);

  const handleSwipeLeft = useCallback((movie) => {
    setIsCardLoading(true);
    playSound('swipe');
    setRecommendations(prev => prev.filter(m => m.id !== movie.id));
    setTimeout(() => setIsCardLoading(false), 300);
  }, [playSound, setRecommendations]);

  const handleSaveVibe = useCallback(() => {
    if (!mood && selectedGenres.length === 0) return;
    const name = prompt("Name your custom vibe (e.g. 'Late Night Thrills'):");
    if (name) {
      savePlaylist(name, { mood, contentType, selectedGenres, selectedProviders, minRating, advancedFilters });
      playSound('save');
      pushToast({
        icon: '✨',
        title: 'Vibe saved',
        message: `"${name}" added to your playlists.`,
        duration: 3000
      });
    }
  }, [mood, contentType, selectedGenres, selectedProviders, minRating, advancedFilters, savePlaylist, playSound, pushToast]);

  const handleClearFilters = useCallback(() => {
    setSelectedGenres([]);
    setMinRating(0);
    setAdvancedFilters({
      yearMin: 1900,
      yearMax: currentYear,
      sortBy: 'popularity.desc',
      matchType: 'all',
      runtime: 'any',
      region: 'US'
    });
    playSound('pop');
  }, [setSelectedGenres, setMinRating, setAdvancedFilters, currentYear, playSound]);

  const timeContext = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { greeting: 'Good morning!', suggestion: 'uplifting', emoji: '☀️' };
    if (hour >= 12 && hour < 17) return { greeting: 'Good afternoon!', suggestion: 'adventure', emoji: '🌤️' };
    if (hour >= 17 && hour < 21) return { greeting: 'Good evening!', suggestion: 'date night', emoji: '🌅' };
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
      const filtered = filteredRecommendations.filter((item) => {
        const title = (item.title || item.name || '').toLowerCase();
        return title.includes(debouncedQuery.toLowerCase());
      });
      return applySearchRanking(filtered, debouncedQuery, tieBreakers);
    }
    if (debouncedQuery && searchScope === 'all') {
      return applySearchRanking(searchResults, debouncedQuery, tieBreakers);
    }
    return filteredRecommendations;
  }, [filteredRecommendations, searchResults, debouncedQuery, searchScope, tieBreakers]);

  const tasteAdjustedResults = useMemo(() => {
    let results = scopedResults;
    if (!showHidden) {
      results = results.filter((item) => statusFor(item.id, item.media_type || contentType) !== 'disliked');
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

  const getProviderKey = useCallback((item) => {
    return `${item.id}-${item.media_type || contentType}-${region}`;
  }, [contentType, region]);

  const filteredByServices = useMemo(() => {
    if (myServices.length === 0) return tasteAdjustedResults;
    return tasteAdjustedResults.filter((item) => {
      const mediaType = item.media_type || contentType;
      const cached = providerSnapshot[getProviderKey(item)] || getCachedTitleProviders(item.id, mediaType, region);
      if (!cached) return true;
      const ids = [
        ...cached.flatrate.map((p) => p.id),
        ...cached.rent.map((p) => p.id),
        ...cached.buy.map((p) => p.id)
      ];
      return myServices.some((id) => ids.includes(id));
    });
  }, [tasteAdjustedResults, myServices, providerSnapshot, getProviderKey, contentType, region]);

  useEffect(() => {
    if (filteredByServices.length === 0) return;
    const controller = new AbortController();
    const itemsToFetch = filteredByServices.slice(0, 12);
    let newSnapshot = {};

    const fetchAll = itemsToFetch.map(async (item) => {
      const mediaType = item.media_type || contentType;
      const key = getProviderKey(item);
      const cached = providerSnapshot[key] || getCachedTitleProviders(item.id, mediaType, region);
      if (cached) return;

      try {
        const data = await fetchTitleProviders(item.id, mediaType, region, controller.signal);
        newSnapshot[key] = data;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Provider lookup failed:', err);
        }
      }
    });

    Promise.all(fetchAll).then(() => {
      if (Object.keys(newSnapshot).length > 0) {
        setProviderSnapshot((prev) => ({
          ...prev,
          ...newSnapshot
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
        isActive={isSurpriseLoading}
        results={trending.length > 0 ? trending : recommendations}
      />

      {surpriseMovie && (
        <div className="surprise-banner">
          <span className="surprise-icon">🎲</span>
          <div className="surprise-content">
            <p>Surprise Pick!</p>
            <h3>{surpriseMovie.title || surpriseMovie.name}</h3>
          </div>
          <Link to={`/${surpriseMovie.media_type || 'movie'}/${surpriseMovie.id}`} className="surprise-link">View →</Link>
        </div>
      )}

      <div className="hero-vibe-bar glass-panel">
        <div className="vibe-greeting">
          <span className="vibe-emoji">{timeContext.emoji}</span>
          <div className="vibe-text">
            <span className="vibe-label">{timeContext.greeting}</span>
            <button className="vibe-suggestion" onClick={() => { setMood(timeContext.suggestion); playSound('pop'); }}>
              Try <span className="text-gold">"{timeContext.suggestion}"</span>
            </button>
          </div>
        </div>
        <div className="hero-actions">
          <button className={`surprise-pill ${isSurpriseLoading ? 'shuffle-anim' : ''}`} onClick={handleSurpriseMe} disabled={isSurpriseLoading}>
            {isSurpriseLoading ? '🎲 Shuffling...' : '🔥 Surprise Me'}
          </button>
        </div>
      </div>

      {!hasAnySearch && <MoodPulse />}

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
                providerBadges={(providerSnapshot[getProviderKey(item)] || getCachedTitleProviders(item.id, item.media_type, region))?.flatrate?.slice(0, 3) || []}
                onLike={like}
                onDislike={dislike}
                tasteStatus={statusFor(item.id, item.media_type)}
                index={idx}
              />
            ))}
          </div>
        </section>
      )}

      <div className="content-toggle-tabs">
        {['all', 'movie', 'tv'].map(type => (
          <button
            key={type}
            className={`content-tab ${contentType === type ? 'active' : ''}`}
            onClick={() => { setContentType(type); setRecommendations([]); setHasSearched(false); }}
          >
            {type === 'all' ? '🎬 All' : type === 'movie' ? '🎥 Movies' : '📺 TV'}
          </button>
        ))}
      </div>

      <div className="mood-selector">
        <div className="mood-input-wrapper">
          <span className="mood-icon">✨</span>
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="What's your mood tonight?"
            aria-label="Mood search"
          />
          {mood && <button className="mood-clear-btn" onClick={() => setMood('')} aria-label="Clear mood">✕</button>}
        </div>
        {recentMoods.length > 0 && !mood && (
          <div className="recent-moods">
            <span className="recent-moods-label">Recent:</span>
            {recentMoods.slice(0, 5).map((recentMood, idx) => (
              <button
                key={idx}
                className="recent-mood-chip"
                onClick={() => { setMood(recentMood); playSound('pop'); }}
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
          id="title-search-input"
          type="text"
          value={titleQuery}
          onChange={(e) => setTitleQuery(e.target.value)}
          placeholder="Search movies or TV"
        />
        <div className="search-scope-toggle" role="group" aria-label="Search scope">
          <button
            className={searchScope === 'within' ? 'active' : ''}
            onClick={() => setSearchScope('within')}
            aria-pressed={searchScope === 'within'}
          >
            Search within mood results
          </button>
          <button
            className={searchScope === 'all' ? 'active' : ''}
            onClick={() => setSearchScope('all')}
            aria-pressed={searchScope === 'all'}
          >
            Search all
          </button>
        </div>
      </div>

      <EmojiPicker onSelect={handleEmojiSelect} selectedGenres={selectedGenres} />

      {recommendations.length === 0 && !isLoading && (
        <MoodPlaylists onSelectPlaylist={({ genres, name, customFilters }) => {
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
        }} />
      )}

      {isMobile && (
        <button className="filters-toggle" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? '✕ Hide Filters' : '⚙️ Filter & Sort'}
          {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
        </button>
      )}

      {(showFilters || !isMobile) && (
        <div className={`filters-wrapper ${activeFilterCount > 0 ? 'has-filters' : ''}`}>
          <div className="genre-filters">
            <h3>Genres:</h3>
            <div className="genre-buttons">
              {genres.map(genre => (
                <button
                  key={genre.id}
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
            <button className="text-button" onClick={handleClearFilters}>
              🧹 Clear All Filters
            </button>
          </div>
        </div>
      )}

      <div className="search-container">
        <button className="primary-button" onClick={handleSearch} disabled={isBusy}>
          {isBusy ? 'Searching...' : 'Get Recommendations'}
        </button>
        <button
          className="secondary-button"
          aria-label="Copy shareable link"
          onClick={async () => {
            try {
              await copyToClipboard(window.location.href);
              pushToast({
                icon: '🔗',
                title: 'Link copied',
                message: 'Shareable link copied to clipboard.',
                duration: 2600
              });
            } catch (err) {
              console.error('Copy link failed:', err);
              pushToast({
                icon: '⚠️',
                title: 'Copy failed',
                message: 'Your browser blocked clipboard access.',
                variant: 'error',
                duration: 4000
              });
            }
          }}
        >
          🔗 Copy Link
        </button>
      </div>

      {error && (
        <ErrorState
          title="Search error"
          message={error}
          onRetry={handleSearch}
        />
      )}

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
            {isCardLoading ? <MovieCardSkeleton /> : (
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
              <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2>Results</h2>
                  <div className="taste-summary">
                    <span>👍 {tasteCounts.liked}</span>
                    <span>👎 {tasteCounts.disliked}</span>
                  </div>
                  <label className="show-hidden-toggle">
                    <input
                      type="checkbox"
                      checked={showHidden}
                      onChange={(e) => setShowHidden(e.target.checked)}
                    />
                    Show hidden
                  </label>
                </div>
                <button className="primary-button" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={handleSaveVibe}>Save Vibe</button>
              </div>
            )}
            <div className="recommendations">
              {filteredByServices.slice(0, visibleCount).map((rec, idx) => (
                <MovieCard
                  key={rec.id}
                  movie={rec}
                  isInWatchlist={isInWatchlist(rec.id)}
                  onToggleWatchlist={toggleWatchlist}
                  isWatched={isWatched(rec.id)}
                  onToggleWatched={toggleWatched}
                  mediaType={rec.media_type}
                  providerBadges={(providerSnapshot[getProviderKey(rec)] || getCachedTitleProviders(rec.id, rec.media_type, region))?.flatrate?.slice(0, 3) || []}
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
              <button className="btn-secondary" onClick={loadMoreResults}>Load More</button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default Home;
