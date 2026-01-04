import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import { SkeletonGrid } from '../components/Skeleton';
import { useWatchlist } from '../hooks/useWatchlist';

const apiKey = process.env.REACT_APP_TMDB_API_KEY;

// Extended mood mapping with more keywords
const moodMap = {
  // Happy/Uplifting
  happy: 35,
  joyful: 35,
  cheerful: 35,
  funny: 35,
  laugh: 35,
  comedy: 35,

  // Sad/Emotional
  sad: 18,
  emotional: 18,
  dramatic: 18,
  crying: 18,
  melancholy: 18,

  // Adventure/Action
  adventurous: 12,
  adventure: 12,
  exciting: 28,
  action: 28,
  adrenaline: 28,

  // Scary/Horror
  scared: 27,
  scary: 27,
  horror: 27,
  spooky: 27,
  creepy: 27,
  terrifying: 27,

  // Romance
  romantic: 10749,
  love: 10749,
  romance: 10749,
  lovely: 10749,

  // Thriller/Mystery
  thrilling: 53,
  thriller: 53,
  suspense: 53,
  mystery: 9648,
  mysterious: 9648,

  // Sci-Fi/Fantasy
  scifi: 878,
  'sci-fi': 878,
  futuristic: 878,
  fantasy: 14,
  magical: 14,

  // Relaxed/Animated
  relaxed: 16,
  chill: 16,
  animated: 16,
  family: 10751,
  kids: 10751,

  // Documentary
  curious: 99,
  documentary: 99,
  learning: 99,
};

function Home() {
  const [mood, setMood] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTV, setIsTV] = useState(false);

  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  // Track current request to prevent race conditions
  const abortControllerRef = useRef(null);

  // Fetch genres with AbortController
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

  const handleGenreClick = useCallback((genreId) => {
    setSelectedGenres((prevSelected) =>
      prevSelected.includes(genreId)
        ? prevSelected.filter((id) => id !== genreId)
        : [...prevSelected, genreId]
    );
  }, []);

  const handleMoodChange = useCallback((event) => {
    setMood(event.target.value);
  }, []);

  const handleToggleContentType = useCallback(() => {
    setIsTV((prev) => !prev);
    setRecommendations([]);
    setSelectedGenres([]);
  }, []);

  const getRecommendations = useCallback(async () => {
    if (!mood && selectedGenres.length === 0) {
      setError('Please enter a mood or select a genre.');
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError('');
    setIsLoading(true);

    const lowerCaseMood = mood.toLowerCase().trim();
    const genreIdFromMood = moodMap[lowerCaseMood];
    let url;

    const allSelectedGenres = [...selectedGenres];
    if (genreIdFromMood && !allSelectedGenres.includes(genreIdFromMood)) {
      allSelectedGenres.push(genreIdFromMood);
    }

    const genreQuery = allSelectedGenres.join(',');
    const endpoint = isTV ? 'tv' : 'movie';

    if (genreQuery) {
      url = `https://api.themoviedb.org/3/discover/${endpoint}?api_key=${apiKey}&with_genres=${genreQuery}&sort_by=popularity.desc`;
    } else {
      // Fallback to search if no genres are selected but mood is present
      url = `https://api.themoviedb.org/3/search/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(mood)}`;
    }

    try {
      const response = await axios.get(url, { signal: controller.signal });
      if (response.data.results && response.data.results.length > 0) {
        // Add media_type to each result
        const resultsWithType = response.data.results.map(item => ({
          ...item,
          media_type: isTV ? 'tv' : 'movie'
        }));
        setRecommendations(resultsWithType);
      } else {
        setRecommendations([]);
        setError('No results found. Try another combination!');
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError('Error fetching data. Please check the console.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [mood, selectedGenres, isTV]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      getRecommendations();
    }
  }, [getRecommendations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <main role="main">
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

      {/* Mood Input */}
      <div className="mood-selector">
        <div className="mood-input-wrapper">
          <span className="mood-icon" aria-hidden="true">✨</span>
          <input
            type="text"
            value={mood}
            onChange={handleMoodChange}
            onKeyDown={handleKeyDown}
            placeholder="What's your mood tonight?"
            aria-label="Enter your mood"
          />
        </div>
      </div>

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
        {isLoading ? (
          <SkeletonGrid count={8} />
        ) : (
          <div className="recommendations">
            {recommendations.map((rec) => (
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
      </div>
    </main>
  );
}

export default Home;