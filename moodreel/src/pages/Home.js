import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import SwipeCard from '../components/SwipeCard';
import EmojiPicker from '../components/EmojiPicker';
import StreamingFilter from '../components/StreamingFilter';
import RatingFilter from '../components/RatingFilter';
import AdvancedFilters from '../components/AdvancedFilters';
import MoodPlaylists from '../components/MoodPlaylists';
import MoodPulse from '../components/MoodPulse';
import { SkeletonGrid, MovieCardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAchievements } from '../hooks/useAchievements';
import { useMoodHistory } from '../hooks/useMoodHistory';
import { useCustomPlaylists } from '../hooks/useCustomPlaylists';
import { useSounds } from '../hooks/useSounds';
import { parseMoodToGenres } from '../utils/moodParser';
import searchService from '../services/searchService';


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
  const [matchType, setMatchType] = useState('all'); // 'all' | 'any'
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
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef(0);
  const mainRef = useRef(null);

  const { isInWatchlist, toggleWatchlist, addToWatchlist, isWatched, toggleWatched } = useWatchlist();
  const { trackSave } = useAchievements();
  const { history, addToHistory } = useMoodHistory();
  const { savePlaylist } = useCustomPlaylists();
  const { playSound } = useSounds();

  const abortControllerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Fetch trending on mount
  useEffect(() => {
    const controller = new AbortController();

    const fetchTrending = async () => {
      try {
        const results = await searchService.fetchTrending('all', 'day', controller.signal);
        setTrending(results);
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
        const data = await searchService.fetchGenres(endpoint, controller.signal);
        setGenres(data);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('Error fetching genres:', err);
        }
      }
    };
    fetchGenres();
    return () => controller.abort();
  }, [contentType]);

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
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      emojiMood.genres.forEach((genreId) => next.add(genreId));
      return Array.from(next);
    });
  }, []);

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

  // Surprise Me - random discovery
  const handleSurpriseMe = useCallback(async () => {
    // If already loading, ignore click
    if (isSurpriseLoading) return;

    playSound('click');
    setIsSurpriseLoading(true);

    // Artificial delay for "shuffling" feel (800ms)
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const randomPick = await searchService.fetchRandomDiscovery();
      if (randomPick) {
        setSurpriseMovie(randomPick);
        // Clear after 10 seconds (gave user a bit more time)
        setTimeout(() => setSurpriseMovie(null), 10000);
      } else {
        // Fallback to trending if discovery fails
        if (trending.length > 0) {
          const randomIndex = Math.floor(Math.random() * trending.length);
          setSurpriseMovie(trending[randomIndex]);
          setTimeout(() => setSurpriseMovie(null), 8000);
        }
      }
    } catch (err) {
      console.error('Surprise me failed:', err);
      // Fallback
      if (trending.length > 0) {
        setSurpriseMovie(trending[0]);
      }
    } finally {
      setIsSurpriseLoading(false);
    }
  }, [trending, playSound, isSurpriseLoading]);


  const getRecommendations = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError('');
    setIsLoading(true);
    setPage(1);
    setHasSearched(true);

    if (mood) {
      addToHistory(mood);
    }

    try {
      const result = await searchService.search({
        query: mood,
        type: contentType,
        genres: selectedGenres,
        providers: selectedProviders,
        minRating,
        matchType,
        ...advancedFilters,
        page: 1,
        multiPage: true
      }, controller.signal);

      if (result.error) {
        setError(result.error);
        setRecommendations([]);
      } else {
        setRecommendations(result.results);
        setHasMore(result.hasMore);
        setPage(result.page || 1);
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError('Network error. Please check your connection.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [mood, selectedGenres, contentType, selectedProviders, minRating, matchType, advancedFilters, addToHistory]);

  const loadMoreResults = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const controller = new AbortController();
    setIsLoading(true);
    const nextPage = page + 1;

    try {
      const result = await searchService.search({
        query: mood,
        type: contentType,
        genres: selectedGenres,
        providers: selectedProviders,
        minRating,
        matchType,
        ...advancedFilters,
        page: nextPage
      }, controller.signal);

      if (result.results.length > 0) {
        setRecommendations(prev => {
          const existingIds = new Set(prev.map(p => `${p.id}-${p.media_type}`));
          const unique = result.results.filter(item => !existingIds.has(`${item.id}-${item.media_type}`));
          return [...prev, ...unique];
        });
        setPage(result.page);
        setHasMore(result.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error('Error loading more:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, mood, contentType, selectedGenres, selectedProviders, minRating, matchType, advancedFilters]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreResults();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMoreResults]);

  const handlePullEnd = useCallback(() => {
    if (pullDistance > 80 && hasSearched) {
      // Trigger refresh
      getRecommendations();
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, hasSearched, getRecommendations]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      getRecommendations();
    }
  }, [getRecommendations]);

  const handleSwipeRight = useCallback((movie) => {
    setIsCardLoading(true);
    playSound('save');
    const added = addToWatchlist(movie);
    if (added) {
      trackSave(added); // Track for achievements
    }
    setRecommendations(prev => prev.filter(m => m.id !== movie.id));
    setTimeout(() => setIsCardLoading(false), 300);
  }, [addToWatchlist, trackSave, playSound]);

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
  const filteredRecommendations = useMemo(() => {
    if (minRating <= 0) return recommendations;
    return recommendations.filter(m => m.vote_average >= minRating);
  }, [recommendations, minRating]);

  const handleSaveVibe = useCallback(() => {
    if (!mood && selectedGenres.length === 0) return;

    const name = prompt("Name your custom vibe (e.g. 'Late Night Thrills', 'Cozy Musicals'):");
    if (name) {
      savePlaylist(name, {
        mood,
        contentType,
        selectedGenres,
        selectedProviders,
        minRating,
        advancedFilters
      });
      playSound('save');
      alert(`Vibe "${name}" saved to your playlists!`);
    }
  }, [mood, contentType, selectedGenres, selectedProviders, minRating, advancedFilters, savePlaylist, playSound]);

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
        <button className="surprise-btn" onClick={handleSurpriseMe} disabled={isSurpriseLoading}>
          {isSurpriseLoading ? '🎲 Rolling...' : '🎲 Surprise Me'}
        </button>
      </div>

      {/* Global Mood Pulse */}
      {!hasSearched && <MoodPulse />}



      {/* Trending Section */}
      {
        trending.length > 0 && recommendations.length === 0 && !hasSearched && (
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
        )
      }

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
      {
        history.length > 0 && (
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
        )
      }

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

      {/* Mood Playlists - Curated Collections */}
      {
        recommendations.length === 0 && !isLoading && (
          <MoodPlaylists onSelectPlaylist={({ genres, name, customFilters }) => {
            if (customFilters) {
              setMood(customFilters.mood || '');
              setContentType(customFilters.contentType || 'all');
              setSelectedGenres(customFilters.selectedGenres || []);
              setSelectedProviders(customFilters.selectedProviders || []);
              setMinRating(customFilters.minRating || 0);
              setAdvancedFilters(customFilters.advancedFilters || {
                yearMin: 1900,
                yearMax: new Date().getFullYear(),
                runtime: 'any',
                sortBy: 'popularity.desc'
              });
            } else {
              setSelectedGenres(genres);
              setMood(name.replace(/^[^\s]+\s/, '')); // Remove emoji prefix
            }
            // Use setTimeout to ensure state updates are processed
            setTimeout(() => getRecommendations(), 0);
          }} />
        )
      }

      {/* Filter Toggle for Mobile */}
      {
        isMobile && (
          <button
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? '✕ Hide Filters' : '🔍 Filter & Sort'}
          </button>
        )
      }

      {/* Conditionally reveal filters on mobile */}
      {
        (showFilters || !isMobile) && (
          <div className="filters-wrapper">
            {/* Genre Filters */}
            <div className="genre-filters">
              <div className="filters-header">
                <h3>Or pick your genres:</h3>
                {selectedGenres.length > 0 && (
                  <div className="filter-actions">
                    <div className="match-toggle">
                      <button
                        className={`toggle-btn ${matchType === 'all' ? 'active' : ''}`}
                        onClick={() => setMatchType('all')}
                        title="Match ALL selected genres (stricter)"
                      >
                        Match All
                      </button>
                      <button
                        className={`toggle-btn ${matchType === 'any' ? 'active' : ''}`}
                        onClick={() => setMatchType('any')}
                        title="Match ANY selected genre (broader)"
                      >
                        Match Any
                      </button>
                    </div>
                    <button
                      className="clear-filters-btn"
                      onClick={() => {
                        setSelectedGenres([]);
                        setMood('');
                      }}
                    >
                      ✕ Clear All
                    </button>
                  </div>
                )}
              </div>
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
        )
      }

      {/* Search Button */}
      <div className={`search-container ${isMobile ? 'sticky-search' : ''}`}>
        <button onClick={getRecommendations} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Get Recommendations'}
        </button>
      </div>

      {/* Error Message with Retry */}
      {
        error && (
          <div className="error-container" role="alert">
            <p className="error">{error}</p>
            <button className="retry-btn" onClick={getRecommendations}>
              🔄 Retry
            </button>
          </div>
        )
      }

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
          <div className="recommendations-container">
            {filteredRecommendations.length > 0 && (
              <div className="results-header">
                <h2>{mood ? `Vibes for "${mood}"` : 'Your Recommendations'}</h2>
                <button className="save-vibe-btn" onClick={handleSaveVibe}>
                  💾 Save this Vibe
                </button>
              </div>
            )}
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
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {hasMore && !isMobile && (
          <div ref={loadMoreRef} className="load-more-trigger">
            {isLoading && <SkeletonGrid count={4} />}
          </div>
        )}
      </div>

    </main >
  );
}

export default Home;
