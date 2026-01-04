import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import { useWatchlist } from '../hooks/useWatchlist';
import { Skeleton } from '../components/Skeleton';

const apiKey = process.env.REACT_APP_TMDB_API_KEY;

// Validate API key on load
if (!apiKey) {
  console.error('REACT_APP_TMDB_API_KEY is not set. Please add it to your .env file or Vercel environment variables.');
}

function MovieDetails() {
  const { id } = useParams();
  const location = useLocation();
  const isTV = location.pathname.startsWith('/tv');
  const mediaType = isTV ? 'tv' : 'movie';

  const [content, setContent] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [providers, setProviders] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyMissing] = useState(!apiKey);

  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    // Don't fetch if API key is missing
    if (!apiKey) {
      setError('API key not configured. Please set REACT_APP_TMDB_API_KEY.');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      setContent(null);
      setSimilar([]);
      setProviders(null);

      try {
        // Fetch all data in parallel
        const [detailsResponse, similarResponse, providersResponse] = await Promise.all([
          axios.get(
            `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${apiKey}`,
            { signal: controller.signal }
          ),
          axios.get(
            `https://api.themoviedb.org/3/${mediaType}/${id}/similar?api_key=${apiKey}`,
            { signal: controller.signal }
          ),
          axios.get(
            `https://api.themoviedb.org/3/${mediaType}/${id}/watch/providers?api_key=${apiKey}`,
            { signal: controller.signal }
          ),
        ]);

        setContent(detailsResponse.data);
        setSimilar(similarResponse.data.results?.slice(0, 6) || []);

        // Get US providers or first available region
        const results = providersResponse.data.results;
        setProviders(results?.US || results?.[Object.keys(results)[0]] || null);

      } catch (err) {
        if (!axios.isCancel(err)) {
          setError('Error fetching details.');
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [id, mediaType]);

  const renderStars = useCallback((rating) => {
    const stars = Math.round(rating / 2);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }, []);

  const handleToggleWatchlist = useCallback(() => {
    if (content) {
      toggleWatchlist({ ...content, media_type: mediaType });
    }
  }, [content, mediaType, toggleWatchlist]);

  if (error) {
    return (
      <main role="main">
        {apiKeyMissing && (
          <div className="api-warning" role="alert">
            <strong>⚠️ API Key Missing:</strong> Set <code>REACT_APP_TMDB_API_KEY</code> in your environment variables.
          </div>
        )}
        <Link to="/" className="back-button">← Back to Discover</Link>
        <p className="error" role="alert">{error}</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main role="main">
        <div className="movie-details">
          <div className="movie-details-header">
            <div className="poster-container">
              <Skeleton height="450px" />
            </div>
            <div className="movie-info">
              <Skeleton height="3rem" width="70%" style={{ marginBottom: '1rem' }} />
              <Skeleton height="1.5rem" width="40%" style={{ marginBottom: '1rem' }} />
              <Skeleton height="6rem" style={{ marginBottom: '1rem' }} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!content) {
    return null;
  }

  const title = content.title || content.name;
  const date = content.release_date || content.first_air_date;
  const year = date ? new Date(date).getFullYear() : '';
  const runtime = content.runtime || (content.episode_run_time?.[0]);

  return (
    <main role="main">
      <Link to="/" className="back-button">← Back to Discover</Link>

      <article className="movie-details">
        <div className="movie-details-header">
          {/* Poster */}
          <div className="poster-container">
            {content.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${content.poster_path}`}
                alt={`${title} poster`}
              />
            ) : (
              <div className="no-poster" style={{ height: '450px' }}>No Poster</div>
            )}
          </div>

          {/* Info */}
          <div className="movie-info">
            <h1>{title}</h1>

            <div className="meta-info">
              {year && (
                <span className="meta-item">
                  <span aria-hidden="true">📅</span> {year}
                </span>
              )}
              {runtime && (
                <span className="meta-item">
                  <span aria-hidden="true">⏱️</span> {runtime} min
                </span>
              )}
              <div className="rating-large" aria-label={`Rating: ${content.vote_average?.toFixed(1)} out of 10`}>
                <span className="stars" aria-hidden="true">{renderStars(content.vote_average)}</span>
                <span>{content.vote_average?.toFixed(1)} / 10</span>
              </div>
            </div>

            <p className="overview">{content.overview}</p>

            {/* Genres */}
            {content.genres && content.genres.length > 0 && (
              <div className="genres-list" role="list" aria-label="Genres">
                {content.genres.map((genre) => (
                  <span key={genre.id} className="genre-tag" role="listitem">
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Add to Watchlist Button */}
            <button
              className="primary-button"
              onClick={handleToggleWatchlist}
              style={{ marginTop: 'var(--spacing-lg)' }}
              aria-pressed={isInWatchlist(content.id)}
            >
              {isInWatchlist(content.id) ? '❤️ In Watchlist' : '🤍 Add to Watchlist'}
            </button>
          </div>
        </div>

        {/* Streaming Providers */}
        {providers && (providers.flatrate || providers.rent || providers.buy) && (
          <section className="streaming-section" aria-labelledby="providers-heading">
            <h3 id="providers-heading">Where to Watch</h3>
            <div className="streaming-providers">
              {/* Subscription streaming */}
              {providers.flatrate?.map((provider) => (
                <img
                  key={provider.provider_id}
                  src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                  alt={provider.provider_name}
                  title={`Stream on ${provider.provider_name}`}
                  className="provider-logo"
                />
              ))}
              {/* Rent */}
              {providers.rent?.slice(0, 4).map((provider) => (
                <img
                  key={`rent-${provider.provider_id}`}
                  src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                  alt={provider.provider_name}
                  title={`Rent on ${provider.provider_name}`}
                  className="provider-logo"
                />
              ))}
            </div>
          </section>
        )}

        {/* Similar Content */}
        {similar.length > 0 && (
          <section className="similar-movies" aria-labelledby="similar-heading">
            <h3 id="similar-heading">You Might Also Like</h3>
            <div className="similar-movies-grid">
              {similar.map((item) => (
                <MovieCard
                  key={item.id}
                  movie={{ ...item, media_type: mediaType }}
                  isInWatchlist={isInWatchlist(item.id)}
                  onToggleWatchlist={toggleWatchlist}
                  mediaType={mediaType}
                />
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}

export default MovieDetails;