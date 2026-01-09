import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import SwipeCard from '../components/SwipeCard';
import EmojiPicker from '../components/EmojiPicker';
import StreamingFilter from '../components/StreamingFilter';
import RatingFilter from '../components/RatingFilter';
import AdvancedFilters from '../components/AdvancedFilters';
import { SkeletonGrid, MovieCardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useWatchlist } from '../hooks/useWatchlist';
import { useMoodHistory } from '../hooks/useMoodHistory';
import { useSounds } from '../hooks/useSounds';
import { canMakeRequest, getRemainingRequests } from '../utils/rateLimiter';
import { parseMoodToGenres } from '../utils/moodParser';

// TMDB API key - uses env var if set, otherwise default key with rate limiting
const apiKey = process.env.REACT_APP_TMDB_API_KEY || 'f2b1a353af51ccd27736c209f7ea0ca6';

// Offline cache key
const CACHE_KEY = 'moodreel-recommendations-cache';

// NOTE: moodMap and parseMoodToGenres imported from '../utils/moodParser'

// Load cached recommendations
function loadCachedRecommendations() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache valid for 1 hour
      if (Date.now() - timestamp < 3600000) {
        return data;
      }
    }
  } catch (e) {
    console.error('Error loading cache:', e);
  }
  return null;
}

// Save recommendations to cache
function cacheRecommendations(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Error caching:', e);
  }
}

function Home() {
  const [mood, setMood] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [error, setError] = useState('');
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contentType, setContentType] = useState('all'); // 'all' | 'movie' | 'tv'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [minRating, setMinRating] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCardLoading, setIsCardLoading] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    yearMin: 1900,
    yearMax: new Date().getFullYear(),
    runtime: 'any',
    sortBy: 'popularity.desc'
  });
  const [surpriseMovie, setSurpriseMovie] = useState(null);
  const [showFilters, setShowFilters] = useState(!isMobile);

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef(0);
  const mainRef = useRef(null);

  const { isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useWatchlist();
  const { history, addToHistory } = useMoodHistory();
  const { playSound } = useSounds();

  const abortControllerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load cached data on mount (offline support)
  useEffect(() => {
    const cached = loadCachedRecommendations();
    if (cached && cached.length > 0) {
      setRecommendations(cached);
      setHasSearched(true);
    }
  }, []);

  // Fetch trending on mount
  useEffect(() => {
    const controller = new AbortController();

    const fetchTrending = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/trending/all/day?api_key=${apiKey}`,
          { signal: controller.signal }
        );
        setTrending(response.data.results.slice(0, 8));
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('Error fetching trending:', err);
        }
      }
    };

    fetchTrending();
    return () => controller.abort();
  }, []);

  // Fetch genres (for 'all', use movie genres as base)
  useEffect(() => {
    const controller = new AbortController();
    const fetchGenres = async () => {
      try {
        const endpoint = contentType === 'tv' ? 'tv' : 'movie';
        const response = await axios.get(
          `https://api.themoviedb.org/3/genre/${endpoint}/list?api_key=${apiKey}`,
          { signal: controller.signal }
        );
        setGenres(response.data.genres);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('Error fetching genres:', err);
        }
      }
    };
    fetchGenres();
    return () => controller.abort();
  }, [contentType]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  // Load more results when page changes
  useEffect(() => {
    if (page === 1) return;
    loadMoreResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Pull-to-refresh handlers
  const handlePullStart = useCallback((e) => {
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handlePullMove = useCallback((e) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - pullStartY.current);
    setPullDistance(Math.min(distance, 150));
  }, [isPulling]);

  const handlePullEnd = useCallback(() => {
    if (pullDistance > 80 && hasSearched) {
      // Trigger refresh
      getRecommendations();
    }
    setIsPulling(false);
    setPullDistance(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pullDistance, hasSearched]);

  const handleGenreClick = useCallback((genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  }, []);

  const handleProviderToggle = useCallback((providerId) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId]
    );
  }, []);

  const handleEmojiSelect = useCallback((emojiMood) => {
    setMood(emojiMood.keyword);
    emojiMood.genres.forEach(genreId => {
      if (!selectedGenres.includes(genreId)) {
        setSelectedGenres(prev => [...prev, genreId]);
      }
    });
  }, [selectedGenres]);

  const handleMoodChange = useCallback((event) => {
    setMood(event.target.value);
  }, []);

  const handleHistoryClick = useCallback((historyMood) => {
    setMood(historyMood);
    // Auto-search with the history mood
    const genres = parseMoodToGenres(historyMood);
    if (genres.length > 0) {
      setSelectedGenres(genres);
    }
  }, []);

  const handleContentTypeChange = useCallback((newType) => {
    setContentType(newType);
    setRecommendations([]);
    setSelectedGenres([]);
    setPage(1);
    setHasSearched(false);
  }, []);

  const handleRatingChange = useCallback((rating) => {
    setMinRating(rating);
  }, []);

  const handleAdvancedFiltersChange = useCallback((filters) => {
    setAdvancedFilters(filters);
  }, []);

  // Time-based greeting and suggestions
  const timeContext = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { greeting: 'Good morning!', suggestion: 'uplifting', emoji: '☀️' };
    } else if (hour >= 12 && hour < 17) {
      return { greeting: 'Good afternoon!', suggestion: 'adventure', emoji: '🌤️' };
    } else if (hour >= 17 && hour < 21) {
      return { greeting: 'Good evening!', suggestion: 'date night', emoji: '🌅' };
    } else {
      return { greeting: 'Late night vibes', suggestion: 'thriller', emoji: '🌙' };
    }
  }, []);

  // Surprise Me - random trending movie
  const handleSurpriseMe = useCallback(() => {
    if (trending.length === 0) return;
    playSound('click');
    const randomIndex = Math.floor(Math.random() * trending.length);
    setSurpriseMovie(trending[randomIndex]);
    // Clear after 8 seconds
    setTimeout(() => setSurpriseMovie(null), 8000);
  }, [trending, playSound]);

  const buildApiUrl = useCallback((pageNum = 1, mediaType = null) => {
    // For 'all' mode, caller specifies which type to build URL for
    const endpoint = mediaType || (contentType === 'tv' ? 'tv' : 'movie');
    const moodGenres = parseMoodToGenres(mood);
    const allGenres = [...new Set([...selectedGenres, ...moodGenres])];
    const sortBy = advancedFilters.sortBy || 'popularity.desc';

    let url = `https://api.themoviedb.org/3/discover/${endpoint}?api_key=${apiKey}&page=${pageNum}&sort_by=${sortBy}`;

    // For "Hidden Gems" (high rating), we must enforce a minimum vote count
    // to avoid movies with one 10.0 vote appearing at the top
    if (sortBy === 'vote_average.desc') {
      url += `&vote_count.gte=300`;
    } else if (sortBy === 'revenue.desc') {
      // Revenue mostly applies to movies
      url += `&vote_count.gte=100`;
    }

    if (allGenres.length > 0) {
      // Use comma for AND logic - results must match ALL selected genres
      url += `&with_genres=${allGenres.join(',')}`;

      // Exclude kids content when mature genres are selected
      const matureGenres = [27, 53, 80, 9648]; // Horror, Thriller, Crime, Mystery
      const kidsGenres = [10751, 16]; // Family, Animation
      const hasMatureGenre = allGenres.some(g => matureGenres.includes(g));
      const hasKidsGenre = allGenres.some(g => kidsGenres.includes(g));

      if (hasMatureGenre && !hasKidsGenre) {
        url += `&without_genres=${kidsGenres.join(',')}`;
      }
    }

    if (selectedProviders.length > 0) {
      url += `&with_watch_providers=${selectedProviders.join('|')}&watch_region=US`;
    }

    // Add minimum rating filter
    if (minRating > 0) {
      url += `&vote_average.gte=${minRating}`;
    }

    // Advanced Filters: Year Range
    const isTV = endpoint === 'tv';
    if (advancedFilters.yearMin > 1900) {
      const date = `${advancedFilters.yearMin}-01-01`;
      url += isTV ? `&first_air_date.gte=${date}` : `&primary_release_date.gte=${date}`;
    }
    if (advancedFilters.yearMax < new Date().getFullYear()) {
      const date = `${advancedFilters.yearMax}-12-31`;
      url += isTV ? `&first_air_date.lte=${date}` : `&primary_release_date.lte=${date}`;
    }

    // Advanced Filters: Runtime
    if (advancedFilters.runtime !== 'any') {
      if (advancedFilters.runtime === 'short') {
        url += `&with_runtime.lte=90`;
      } else if (advancedFilters.runtime === 'medium') {
        url += `&with_runtime.gte=90&with_runtime.lte=150`;
      } else if (advancedFilters.runtime === 'long') {
        url += `&with_runtime.gte=150`;
      }
    }

    return { url, hasGenreFilter: allGenres.length > 0 };
  }, [contentType, mood, selectedGenres, selectedProviders, minRating, advancedFilters]);

  const getRecommendations = useCallback(async () => {
    if (!mood && selectedGenres.length === 0) {
      setError('Please enter a mood or select a genre.');
      return;
    }

    // Check rate limit before making request
    if (!canMakeRequest()) {
      setError(`Rate limit reached. Please wait a moment before searching again. (${getRemainingRequests()} requests remaining)`);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError('');
    setIsLoading(true);
    setPage(1);
    setHasSearched(true);

    // Add to mood history
    if (mood) {
      addToHistory(mood);
    }

    try {
      let allResults = [];
      let maxTotalPages = 0;

      if (contentType === 'all') {
        // Fetch both movies and TV, pages 1 & 2 in parallel for more results
        const { url: movieUrl1, hasGenreFilter: movieHasGenre } = buildApiUrl(1, 'movie');
        const { url: movieUrl2 } = buildApiUrl(2, 'movie');
        const { url: tvUrl1, hasGenreFilter: tvHasGenre } = buildApiUrl(1, 'tv');
        const { url: tvUrl2 } = buildApiUrl(2, 'tv');

        // Build search URLs if no genre filter
        const getUrl = (url, hasGenre, type, pg) => {
          if (hasGenre) return url;
          return `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(mood)}&page=${pg}&include_adult=false`;
        };

        const movieFinal1 = getUrl(movieUrl1, movieHasGenre, 'movie', 1);
        const movieFinal2 = getUrl(movieUrl2, movieHasGenre, 'movie', 2);
        const tvFinal1 = getUrl(tvUrl1, tvHasGenre, 'tv', 1);
        const tvFinal2 = getUrl(tvUrl2, tvHasGenre, 'tv', 2);

        const [movieRes1, movieRes2, tvRes1, tvRes2] = await Promise.all([
          axios.get(movieFinal1, { signal: controller.signal }),
          axios.get(movieFinal2, { signal: controller.signal }).catch(() => ({ data: { results: [] } })),
          axios.get(tvFinal1, { signal: controller.signal }),
          axios.get(tvFinal2, { signal: controller.signal }).catch(() => ({ data: { results: [] } }))
        ]);

        // Combine page 1 & 2 results
        const movies = [
          ...(movieRes1.data.results || []),
          ...(movieRes2.data.results || [])
        ].map(item => ({ ...item, media_type: 'movie' }));

        const tvShows = [
          ...(tvRes1.data.results || []),
          ...(tvRes2.data.results || [])
        ].map(item => ({ ...item, media_type: 'tv' }));

        // Interleave results for variety
        for (let i = 0; i < Math.max(movies.length, tvShows.length); i++) {
          if (movies[i]) allResults.push(movies[i]);
          if (tvShows[i]) allResults.push(tvShows[i]);
        }

        maxTotalPages = Math.max(movieRes1.data.total_pages || 0, tvRes1.data.total_pages || 0);
        // We've already fetched page 2, so set page state to 2
        setPage(2);
      } else {
        // Single type fetch - 2 pages for more results
        const { url: url1, hasGenreFilter } = buildApiUrl(1);
        const { url: url2 } = buildApiUrl(2);
        const isTV = contentType === 'tv';

        const getFinalUrl = (url, hasGenre, pg) => {
          if (hasGenre) return url;
          return `https://api.themoviedb.org/3/search/${isTV ? 'tv' : 'movie'}?api_key=${apiKey}&query=${encodeURIComponent(mood)}&page=${pg}&include_adult=false`;
        };

        const finalUrl1 = getFinalUrl(url1, hasGenreFilter, 1);
        const finalUrl2 = getFinalUrl(url2, hasGenreFilter, 2);

        const [res1, res2] = await Promise.all([
          axios.get(finalUrl1, { signal: controller.signal }),
          axios.get(finalUrl2, { signal: controller.signal }).catch(() => ({ data: { results: [] } }))
        ]);

        allResults = [
          ...(res1.data.results || []),
          ...(res2.data.results || [])
        ].map(item => ({
          ...item,
          media_type: isTV ? 'tv' : 'movie'
        }));
        maxTotalPages = res1.data.total_pages || 0;
        setPage(2);
      }

      // Apply client-side rating filter as backup
      if (minRating > 0) {
        allResults = allResults.filter(m => m.vote_average >= minRating);
      }

      if (allResults.length > 0) {
        setRecommendations(allResults);
        setHasMore(1 < maxTotalPages);
        cacheRecommendations(allResults);
      } else {
        setRecommendations([]);
        setError('');
        setHasMore(false);
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        const cached = loadCachedRecommendations();
        if (cached && cached.length > 0) {
          setRecommendations(cached);
          setError('Showing cached results (offline mode)');
        } else {
          setError('Network error. Please check your connection.');
        }
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [mood, selectedGenres, contentType, addToHistory, buildApiUrl, minRating]);

  const loadMoreResults = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const controller = new AbortController();
    setIsLoading(true);
    const nextPage = page + 1;

    try {
      let newResults = [];
      let maxTotalPages = 0;

      if (contentType === 'all') {
        // Fetch both movies and TV in parallel
        const { url: movieUrl } = buildApiUrl(nextPage, 'movie');
        const { url: tvUrl } = buildApiUrl(nextPage, 'tv');

        const [movieRes, tvRes] = await Promise.all([
          axios.get(movieUrl, { signal: controller.signal }),
          axios.get(tvUrl, { signal: controller.signal })
        ]);

        const movies = (movieRes.data.results || []).map(item => ({ ...item, media_type: 'movie' }));
        const tvShows = (tvRes.data.results || []).map(item => ({ ...item, media_type: 'tv' }));

        // Interleave results
        for (let i = 0; i < Math.max(movies.length, tvShows.length); i++) {
          if (movies[i]) newResults.push(movies[i]);
          if (tvShows[i]) newResults.push(tvShows[i]);
        }

        maxTotalPages = Math.max(movieRes.data.total_pages || 0, tvRes.data.total_pages || 0);
      } else {
        const { url } = buildApiUrl(nextPage);
        const response = await axios.get(url, { signal: controller.signal });
        newResults = (response.data.results || []).map(item => ({
          ...item,
          media_type: contentType === 'tv' ? 'tv' : 'movie'
        }));
        maxTotalPages = response.data.total_pages || 0;
      }

      // Apply rating filter
      if (minRating > 0) {
        newResults = newResults.filter(m => m.vote_average >= minRating);
      }

      // Filter out duplicates and add to results
      setRecommendations(prev => {
        const existingIds = new Set(prev.map(p => `${p.id}-${p.media_type}`));
        const unique = newResults.filter(item => !existingIds.has(`${item.id}-${item.media_type}`));
        return [...prev, ...unique];
      });

      setHasMore(nextPage < maxTotalPages);
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error('Error loading more:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, buildApiUrl, contentType, minRating]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      getRecommendations();
    }
  }, [getRecommendations]);

  const handleSwipeRight = useCallback((movie) => {
    setIsCardLoading(true);
    playSound('save');
    toggleWatchlist(movie);
    setRecommendations(prev => prev.filter(m => m.id !== movie.id));
    setTimeout(() => setIsCardLoading(false), 300);
  }, [toggleWatchlist, playSound]);

  const handleSwipeLeft = useCallback((movie) => {
    setIsCardLoading(true);
    playSound('swipe');
    setRecommendations(prev => prev.filter(m => m.id !== movie.id));
    setTimeout(() => setIsCardLoading(false), 300);
  }, [playSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Filter recommendations by rating (for display)
  const filteredRecommendations = minRating > 0
    ? recommendations.filter(m => m.vote_average >= minRating)
    : recommendations;

  return (
    <main
      role="main"
      ref={mainRef}
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={handlePullEnd}
    >
      {/* Pull-to-refresh indicator */}
      {isPulling && pullDistance > 0 && (
        <div
          className="pull-indicator"
          style={{ height: pullDistance, opacity: pullDistance / 100 }}
        >
          <span className={pullDistance > 80 ? 'ready' : ''}>
            {pullDistance > 80 ? '↓ Release to refresh' : '↓ Pull to refresh'}
          </span>
        </div>
      )}

      {/* Surprise Movie Banner */}
      {surpriseMovie && (
        <div className="surprise-banner">
          <span className="surprise-icon">🎲</span>
          <div className="surprise-content">
            <p>Surprise Pick!</p>
            <h3>{surpriseMovie.title || surpriseMovie.name}</h3>
          </div>
          <a href={`/${surpriseMovie.media_type}/${surpriseMovie.id}`} className="surprise-link">
            View →
          </a>
        </div>
      )}

      {/* Time-based greeting */}
      <div className="time-greeting">
        <span className="time-emoji">{timeContext.emoji}</span>
        <span>{timeContext.greeting}</span>
        <button
          className="time-suggestion-btn"
          onClick={() => setMood(timeContext.suggestion)}
        >
          Try "{timeContext.suggestion}" vibes?
        </button>
        <button className="surprise-btn" onClick={handleSurpriseMe}>
          🎲 Surprise Me
        </button>
      </div>

      {/* Trending Section */}
      {trending.length > 0 && recommendations.length === 0 && !hasSearched && (
        <section className="trending-section" aria-labelledby="trending-heading">
          <h2 id="trending-heading">🔥 Trending Now</h2>
          <div className="trending-grid">
            {trending.map((item) => (
              <MovieCard
                key={item.id}
                movie={item}
                isInWatchlist={isInWatchlist(item.id)}
                onToggleWatchlist={toggleWatchlist}
                isWatched={isWatched(item.id)}
                onToggleWatched={toggleWatched}
                mediaType={item.media_type}
              />
            ))}
          </div>
        </section>
      )}

      {/* Content Type Toggle - 3-way */}
      <div className="content-toggle-tabs" role="tablist" aria-label="Content type">
        <button
          role="tab"
          className={`content-tab ${contentType === 'all' ? 'active' : ''}`}
          onClick={() => handleContentTypeChange('all')}
          aria-selected={contentType === 'all'}
        >
          🎬 All
        </button>
        <button
          role="tab"
          className={`content-tab ${contentType === 'movie' ? 'active' : ''}`}
          onClick={() => handleContentTypeChange('movie')}
          aria-selected={contentType === 'movie'}
        >
          🎥 Movies
        </button>
        <button
          role="tab"
          className={`content-tab ${contentType === 'tv' ? 'active' : ''}`}
          onClick={() => handleContentTypeChange('tv')}
          aria-selected={contentType === 'tv'}
        >
          📺 TV Shows
        </button>
      </div>

      {/* Mood History */}
      {history.length > 0 && (
        <div className="mood-history">
          <span className="history-label">Recent:</span>
          {history.slice(0, 5).map((h, i) => (
            <button
              key={i}
              className="history-chip"
              onClick={() => handleHistoryClick(h)}
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {/* Mood Input */}
      <div className="mood-selector">
        <div className="mood-input-wrapper">
          <span className="mood-icon" aria-hidden="true">✨</span>
          <input
            type="text"
            value={mood}
            onChange={handleMoodChange}
            onKeyDown={handleKeyDown}
            placeholder="What's your mood tonight? (e.g. 'cozy rainy day')"
            aria-label="Enter your mood"
          />
        </div>
      </div>

      {/* Emoji Picker */}
      <EmojiPicker onSelect={handleEmojiSelect} selectedGenres={selectedGenres} />

      {/* Filter Toggle for Mobile */}
      {isMobile && (
        <button
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? '✕ Hide Filters' : '🔍 Filter & Sort'}
        </button>
      )}

      {/* Conditionally reveal filters on mobile */}
      {(showFilters || !isMobile) && (
        <div className="filters-wrapper">
          {/* Genre Filters */}
          <div className="genre-filters">
            <h3>Or pick your genres:</h3>
            <div className="genre-buttons" role="group" aria-label="Genre filters">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre.id)}
                  className={selectedGenres.includes(genre.id) ? 'active' : ''}
                  aria-pressed={selectedGenres.includes(genre.id)}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Streaming Filter */}
          <StreamingFilter
            selectedProviders={selectedProviders}
            onToggle={handleProviderToggle}
          />

          {/* Rating Filter */}
          <RatingFilter
            minRating={minRating}
            onRatingChange={handleRatingChange}
          />

          {/* Advanced Filters */}
          <AdvancedFilters
            filters={advancedFilters}
            onFiltersChange={handleAdvancedFiltersChange}
          />
        </div>
      )}

      {/* Search Button */}
      <div className={`search-container ${isMobile ? 'sticky-search' : ''}`}>
        <button onClick={getRecommendations} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Get Recommendations'}
        </button>
      </div>

      {/* Error Message with Retry */}
      {error && (
        <div className="error-container" role="alert">
          <p className="error">{error}</p>
          <button className="retry-btn" onClick={getRecommendations}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* Results */}
      <div aria-live="polite" aria-busy={isLoading}>
        {isLoading && recommendations.length === 0 ? (
          <SkeletonGrid count={8} />
        ) : isMobile && hasSearched ? (
          /* Mobile Swipe View */
          <div className="swipe-container">
            {filteredRecommendations.length > 0 ? (
              <>
                <p className="swipe-hint">← Swipe left to pass, right to save →</p>
                <p className="swipe-count">
                  {filteredRecommendations.length} {filteredRecommendations.length === 1 ? 'movie' : 'movies'} remaining
                </p>
                {isCardLoading ? (
                  <div className="swipe-card-loading">
                    <MovieCardSkeleton />
                  </div>
                ) : (
                  <SwipeCard
                    movie={filteredRecommendations[0]}
                    nextMovie={filteredRecommendations[1]}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                    mediaType={filteredRecommendations[0]?.media_type}
                  />
                )}
              </>
            ) : (
              /* Empty state for swipe cards */
              <EmptyState
                icon="🎬"
                title="All caught up!"
                description="You've gone through all the current recommendations. Ready for more?"
                onActionClick={getRecommendations}
                actionText="Get More Recommendations"
              />
            )}
          </div>
        ) : (
          /* Desktop Grid View */
          <div className="recommendations">
            {filteredRecommendations.length > 0 ? (
              filteredRecommendations.map((rec) => (
                <MovieCard
                  key={rec.id}
                  movie={rec}
                  isInWatchlist={isInWatchlist(rec.id)}
                  onToggleWatchlist={toggleWatchlist}
                  isWatched={isWatched(rec.id)}
                  onToggleWatched={toggleWatched}
                  mediaType={rec.media_type}
                />
              ))
            ) : hasSearched && !isLoading && (
              <EmptyState
                icon="✨"
                title="No results found"
                description={`We couldn't find anything for "${mood}". Try a different mood or clear your filters!`}
                onActionClick={() => setMood('')}
                actionText="Clear Search"
              />
            )}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {hasMore && !isMobile && (
          <div ref={loadMoreRef} className="load-more-trigger">
            {isLoading && <SkeletonGrid count={4} />}
          </div>
        )}
      </div>
    </main>
  );
}

export default Home;