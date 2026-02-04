import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import MovieCard from '../components/MovieCard';
import SwipeCard from '../components/SwipeCard';
import EmojiPicker from '../components/EmojiPicker';
import StreamingFilter, { STREAMING_PROVIDERS } from '../components/StreamingFilter';
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
import { useMovieDiscovery } from '../hooks/useMovieDiscovery';
import { useWindowSize } from '../hooks/useWindowSize';
import searchService from '../services/searchService';

function Home() {
  const currentYear = new Date().getFullYear();
  const { isMobile } = useWindowSize();
  const { playSound } = useSounds();
  const { isInWatchlist, toggleWatchlist, addToWatchlist, isWatched, toggleWatched } = useWatchlist();
  const { trackSave } = useAchievements();
  const { addToHistory } = useMoodHistory();
  const { savePlaylist } = useCustomPlaylists();

  const {
    mood, setMood,
    recommendations, setRecommendations,
    trending, setTrending,
    error,
    selectedGenres, setSelectedGenres,
    selectedProviders, setSelectedProviders,
    isLoading,
    contentType, setContentType,
    hasMore,
    minRating, setMinRating,
    hasSearched, setHasSearched,
    advancedFilters, setAdvancedFilters,
    fetchTrending,
    search: getRecommendations,
    loadMore: loadMoreResults
  } = useMovieDiscovery(currentYear);

  const [genres, setGenres] = useState([]);
  const [isCardLoading, setIsCardLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);
  const [surpriseMovie, setSurpriseMovie] = useState(null);

  const loadMoreRef = useRef(null);

  const genreMap = useMemo(() => {
    return new Map(genres.map((genre) => [genre.id, genre.name]));
  }, [genres]);

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

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreResults();
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
    setSelectedProviders((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId]
    );
  }, [setSelectedProviders]);

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
    setIsSurpriseLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
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
      alert(`Vibe "${name}" saved!`);
    }
  }, [mood, contentType, selectedGenres, selectedProviders, minRating, advancedFilters, savePlaylist, playSound]);

  const timeContext = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { greeting: 'Good morning!', suggestion: 'uplifting', emoji: '☀️' };
    if (hour >= 12 && hour < 17) return { greeting: 'Good afternoon!', suggestion: 'adventure', emoji: '🌤️' };
    if (hour >= 17 && hour < 21) return { greeting: 'Good evening!', suggestion: 'date night', emoji: '🌅' };
    return { greeting: 'Late night vibes', suggestion: 'thriller', emoji: '🌙' };
  }, []);

  const filteredRecommendations = useMemo(() => {
    if (minRating <= 0) return recommendations;
    return recommendations.filter(m => m.vote_average >= minRating);
  }, [recommendations, minRating]);

  const handleSearch = useCallback(() => {
    if (mood) addToHistory(mood);
    getRecommendations();
  }, [mood, addToHistory, getRecommendations]);

  return (
    <main className="page-enter">
      {surpriseMovie && (
        <div className="surprise-banner">
          <span className="surprise-icon">🎲</span>
          <div className="surprise-content">
            <p>Surprise Pick!</p>
            <h3>{surpriseMovie.title || surpriseMovie.name}</h3>
          </div>
          <a href={`/${surpriseMovie.media_type}/${surpriseMovie.id}`} className="surprise-link">View →</a>
        </div>
      )}

      <div className="time-greeting">
        <span className="time-emoji">{timeContext.emoji}</span>
        <span>{timeContext.greeting}</span>
        <button className="time-suggestion-btn" onClick={() => setMood(timeContext.suggestion)}>
          Try "{timeContext.suggestion}"?
        </button>
        <button className="surprise-btn" onClick={handleSurpriseMe} disabled={isSurpriseLoading}>
          {isSurpriseLoading ? '🎲 Rolling...' : '🎲 Surprise Me'}
        </button>
      </div>

      {!hasSearched && <MoodPulse />}

      {trending.length > 0 && recommendations.length === 0 && !hasSearched && (
        <section className="trending-section">
          <h2>🔥 Trending Now</h2>
          <div className="recommendations">
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
          />
          {mood && <button className="mood-clear-btn" onClick={() => setMood('')}>✕</button>}
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
        <button className="primary-button" onClick={() => setShowFilters(!showFilters)} style={{ marginBottom: '20px' }}>
          {showFilters ? 'Hide Filters' : 'Filter & Sort'}
        </button>
      )}

      {(showFilters || !isMobile) && (
        <div className="filters-wrapper">
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
          <StreamingFilter selectedProviders={selectedProviders} onToggle={handleProviderToggle} />
          <RatingFilter minRating={minRating} onRatingChange={setMinRating} />
          <AdvancedFilters filters={advancedFilters} onFiltersChange={setAdvancedFilters} />
        </div>
      )}

      <div className="search-container">
        <button className="primary-button" onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Get Recommendations'}
        </button>
      </div>

      {error && <div className="error-container"><p className="error">{error}</p></div>}

      <div aria-live="polite">
        {isLoading && recommendations.length === 0 ? (
          <SkeletonGrid count={8} />
        ) : isMobile && hasSearched && filteredRecommendations.length > 0 ? (
          <div className="swipe-container" style={{ textAlign: 'center' }}>
            {isCardLoading ? <MovieCardSkeleton /> : (
              <SwipeCard
                movie={filteredRecommendations[0]}
                nextMovie={filteredRecommendations[1]}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                mediaType={filteredRecommendations[0]?.media_type}
              />
            )}
          </div>
        ) : (
          <div className="recommendations-container">
            {filteredRecommendations.length > 0 && (
              <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Results</h2>
                <button className="primary-button" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={handleSaveVibe}>Save Vibe</button>
              </div>
            )}
            <div className="recommendations">
              {filteredRecommendations.map(rec => (
                <MovieCard
                  key={rec.id}
                  movie={rec}
                  isInWatchlist={isInWatchlist(rec.id)}
                  onToggleWatchlist={toggleWatchlist}
                  isWatched={isWatched(rec.id)}
                  onToggleWatched={toggleWatched}
                  mediaType={rec.media_type}
                />
              ))}
              {hasSearched && !isLoading && filteredRecommendations.length === 0 && (
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

        {hasMore && !isMobile && (
          <div ref={loadMoreRef} style={{ textAlign: 'center', padding: '40px' }}>
            {isLoading ? <SkeletonGrid count={4} /> : <button className="primary-button" onClick={loadMoreResults}>Load More</button>}
          </div>
        )}
      </div>
    </main>
  );
}

export default Home;
