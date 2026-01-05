import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import SwipeCard from '../components/SwipeCard';
import EmojiPicker from '../components/EmojiPicker';
import StreamingFilter from '../components/StreamingFilter';
import RatingFilter from '../components/RatingFilter';
import { SkeletonGrid, MovieCardSkeleton } from '../components/Skeleton';
import { useWatchlist } from '../hooks/useWatchlist';
import { useMoodHistory } from '../hooks/useMoodHistory';

// Use environment variable if set, otherwise use default key
const apiKey = process.env.REACT_APP_TMDB_API_KEY || 'f2b1a353af51ccd27736c209f7ea0ca6';

// Offline cache key
const CACHE_KEY = 'moodreel-recommendations-cache';

// Extended mood mapping with NLP-style phrase support
const moodMap = {
  // Happy/Uplifting
  happy: 35, joyful: 35, cheerful: 35, funny: 35, laugh: 35, comedy: 35,
  uplifting: 35, 'feel good': 35, 'pick me up': 35, lighthearted: 35,

  // Sad/Emotional
  sad: 18, emotional: 18, dramatic: 18, crying: 18, melancholy: 18,
  heartbreak: 18, breakup: 18, 'after a breakup': 18, tearjerker: 18,

  // Adventure/Action
  adventurous: 12, adventure: 12, exciting: 28, action: 28, adrenaline: 28,
  epic: 28, explosive: 28, intense: 28,

  // Scary/Horror
  scared: 27, scary: 27, horror: 27, spooky: 27, creepy: 27, terrifying: 27,
  halloween: 27, nightmare: 27,

  // Romance
  romantic: 10749, love: 10749, romance: 10749, lovely: 10749,
  'date night': 10749, passionate: 10749, 'fall in love': 10749,

  // Thriller/Mystery
  thrilling: 53, thriller: 53, suspense: 53, mystery: 9648, mysterious: 9648,
  tense: 53, 'edge of seat': 53,

  // Sci-Fi/Fantasy
  scifi: 878, 'sci-fi': 878, futuristic: 878, fantasy: 14, magical: 14,
  space: 878, aliens: 878, wizards: 14,

  // Relaxed/Animated
  relaxed: 16, chill: 16, animated: 16, family: 10751, kids: 10751,
  cozy: 16, 'rainy day': 18, comfort: 35,

  // Documentary
  curious: 99, documentary: 99, learning: 99, educational: 99,
  'true story': 99, inspiring: 99,
};

// Parse mood text to extract genre IDs
function parseMoodToGenres(text) {
  const lower = text.toLowerCase().trim();
  const genres = new Set();

  // Check for exact matches first
  if (moodMap[lower]) {
    genres.add(moodMap[lower]);
    return Array.from(genres);
  }

  // Check for partial matches / phrases
  for (const [phrase, genreId] of Object.entries(moodMap)) {
    if (lower.includes(phrase) || phrase.includes(lower)) {
      genres.add(genreId);
    }
  }

  return Array.from(genres);
}

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
  const [isTV, setIsTV] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [minRating, setMinRating] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCardLoading, setIsCardLoading] = useState(false);

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef(0);
  const mainRef = useRef(null);

  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { history, addToHistory } = useMoodHistory();

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

  // Fetch genres
  useEffect(() => {
    const controller = new AbortController();
    const fetchGenres = async () => {
      try {
        const endpoint = isTV ? 'tv' : 'movie';
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
  }, [isTV]);

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

  const handleToggleContentType = useCallback(() => {
    setIsTV((prev) => !prev);
    setRecommendations([]);
    setSelectedGenres([]);
    setPage(1);
    setHasSearched(false);
  }, []);

  const handleRatingChange = useCallback((rating) => {
    setMinRating(rating);
  }, []);

  const buildApiUrl = useCallback((pageNum = 1) => {
    const endpoint = isTV ? 'tv' : 'movie';
    const moodGenres = parseMoodToGenres(mood);
    const allGenres = [...new Set([...selectedGenres, ...moodGenres])];

    let url = `https://api.themoviedb.org/3/discover/${endpoint}?api_key=${apiKey}&page=${pageNum}&sort_by=popularity.desc`;

    if (allGenres.length > 0) {
      url += `&with_genres=${allGenres.join(',')}`;
    }

    if (selectedProviders.length > 0) {
      url += `&with_watch_providers=${selectedProviders.join('|')}&watch_region=US`;
    }

    // Add minimum rating filter
    if (minRating > 0) {
      url += `&vote_average.gte=${minRating}`;
    }

    return { url, hasGenreFilter: allGenres.length > 0 };
  }, [isTV, mood, selectedGenres, selectedProviders, minRating]);

  const getRecommendations = useCallback(async () => {
    if (!mood && selectedGenres.length === 0) {
      setError('Please enter a mood or select a genre.');
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

    const { url, hasGenreFilter } = buildApiUrl(1);

    // If no genre filter, use search endpoint instead
    const finalUrl = hasGenreFilter
      ? url
      : `https://api.themoviedb.org/3/search/${isTV ? 'tv' : 'movie'}?api_key=${apiKey}&query=${encodeURIComponent(mood)}`;

    try {
      const response = await axios.get(finalUrl, { signal: controller.signal });
      if (response.data.results?.length > 0) {
        let resultsWithType = response.data.results.map(item => ({
          ...item,
          media_type: isTV ? 'tv' : 'movie'
        }));

        // Apply client-side rating filter as backup
        if (minRating > 0) {
          resultsWithType = resultsWithType.filter(m => m.vote_average >= minRating);
        }

        setRecommendations(resultsWithType);
        setHasMore(response.data.page < response.data.total_pages);

        // Cache for offline use
        cacheRecommendations(resultsWithType);
      } else {
        setRecommendations([]);
        setError('No results found. Try another combination!');
        setHasMore(false);
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        // Try to load from cache on network error
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
  }, [mood, selectedGenres, isTV, addToHistory, buildApiUrl, minRating]);

  const loadMoreResults = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const controller = new AbortController();
    setIsLoading(true);

    const { url } = buildApiUrl(page);

    try {
      const response = await axios.get(url, { signal: controller.signal });
      if (response.data.results?.length > 0) {
        let resultsWithType = response.data.results.map(item => ({
          ...item,
          media_type: isTV ? 'tv' : 'movie'
        }));

        // Apply rating filter
        if (minRating > 0) {
          resultsWithType = resultsWithType.filter(m => m.vote_average >= minRating);
        }

        setRecommendations(prev => [...prev, ...resultsWithType]);
        setHasMore(response.data.page < response.data.total_pages);
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error('Error loading more:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, buildApiUrl, isTV, minRating]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      getRecommendations();
    }
  }, [getRecommendations]);

  const handleSwipeRight = useCallback((movie) => {
    setIsCardLoading(true);
    toggleWatchlist(movie);
    // Also remove the card from recommendations so the next card appears
    setRecommendations(prev => prev.filter(m => m.id !== movie.id));
    setTimeout(() => setIsCardLoading(false), 300);
  }, [toggleWatchlist]);

  const handleSwipeLeft = useCallback((movie) => {
    setIsCardLoading(true);
    setRecommendations(prev => prev.filter(m => m.id !== movie.id));
    setTimeout(() => setIsCardLoading(false), 300);
  }, []);

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
                mediaType={item.media_type}
              />
            ))}
          </div>
        </section>
      )}

      {/* Content Type Toggle */}
      <div className="content-toggle">
        <span className={`toggle-label ${!isTV ? 'active' : ''}`}>Movies</span>
        <button
          className={`toggle-switch ${isTV ? 'active' : ''}`}
          onClick={handleToggleContentType}
          aria-label={`Switch to ${isTV ? 'movies' : 'TV shows'}`}
          aria-pressed={isTV}
        />
        <span className={`toggle-label ${isTV ? 'active' : ''}`}>TV Shows</span>
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

      {/* Search Button */}
      <div className="search-container">
        <button onClick={getRecommendations} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Get Recommendations'}
        </button>
      </div>

      {/* Error Message */}
      {error && <p className="error" role="alert">{error}</p>}

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
              <div className="swipe-empty-state">
                <div className="empty-icon">🎬</div>
                <h3>All caught up!</h3>
                <p>You've gone through all the recommendations.</p>
                <button onClick={getRecommendations} className="primary-button">
                  🔄 Get More Recommendations
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Desktop Grid View */
          <div className="recommendations">
            {filteredRecommendations.map((rec) => (
              <MovieCard
                key={rec.id}
                movie={rec}
                isInWatchlist={isInWatchlist(rec.id)}
                onToggleWatchlist={toggleWatchlist}
                mediaType={rec.media_type}
              />
            ))}
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