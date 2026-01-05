import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import ShareButtons from '../components/ShareButtons';
import StarRating from '../components/StarRating';
import TrailerModal from '../components/TrailerModal';
import { useWatchlist } from '../hooks/useWatchlist';
import { useRatings } from '../hooks/useRatings';
import { Skeleton } from '../components/Skeleton';

// Use environment variable if set, otherwise use default key
const apiKey = process.env.REACT_APP_TMDB_API_KEY || 'f2b1a353af51ccd27736c209f7ea0ca6';

function MovieDetails() {
  const { id } = useParams();
  const location = useLocation();
  const isTV = location.pathname.startsWith('/tv');
  const mediaType = isTV ? 'tv' : 'movie';

  const [content, setContent] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [providers, setProviders] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [cast, setCast] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  const { isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useWatchlist();
  const { getRating, setRating, getReview, setReview } = useRatings();

  // Get stored rating/review
  const userRating = getRating(id);
  const userReview = getReview(id);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      setContent(null);
      setSimilar([]);
      setProviders(null);
      setTrailer(null);
      setCast([]);

      try {
        // Fetch all data in parallel (including videos for trailers and credits for cast)
        const [detailsResponse, similarResponse, providersResponse, videosResponse, creditsResponse] = await Promise.all([
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
          axios.get(
            `https://api.themoviedb.org/3/${mediaType}/${id}/videos?api_key=${apiKey}`,
            { signal: controller.signal }
          ),
          axios.get(
            `https://api.themoviedb.org/3/${mediaType}/${id}/credits?api_key=${apiKey}`,
            { signal: controller.signal }
          ),
        ]);

        setContent(detailsResponse.data);
        setSimilar(similarResponse.data.results?.slice(0, 6) || []);

        // Get US providers or first available region
        const results = providersResponse.data.results;
        setProviders(results?.US || results?.[Object.keys(results)[0]] || null);

        // Find YouTube trailer
        const videos = videosResponse.data.results || [];
        const trailerVideo = videos.find(v =>
          v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        ) || videos.find(v => v.site === 'YouTube');
        setTrailer(trailerVideo || null);

        // Get top 6 cast members
        const castData = creditsResponse.data.cast || [];
        setCast(castData.slice(0, 6));

        // Load saved review text
        const savedReview = getReview(id);
        if (savedReview) {
          setReviewText(savedReview);
        }

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
  }, [id, mediaType, getReview]);

  const renderStars = useCallback((rating) => {
    const stars = Math.round(rating / 2);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }, []);

  const handleToggleWatchlist = useCallback(() => {
    if (content) {
      toggleWatchlist({ ...content, media_type: mediaType });
    }
  }, [content, mediaType, toggleWatchlist]);

  const handleRatingChange = useCallback((rating) => {
    setRating(id, rating);
  }, [id, setRating]);

  const handleReviewSubmit = useCallback(() => {
    setReview(id, reviewText);
    setShowReviewForm(false);
  }, [id, reviewText, setReview]);

  if (error) {
    return (
      <main role="main">
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

            {/* Action Buttons Row */}
            <div className="action-buttons">
              <button
                className="primary-button"
                onClick={handleToggleWatchlist}
                aria-pressed={isInWatchlist(content.id)}
              >
                {isInWatchlist(content.id) ? '❤️ In Watchlist' : '🤍 Add to Watchlist'}
              </button>

              {isInWatchlist(content.id) && (
                <button
                  className={`watched-btn ${isWatched(content.id) ? 'watched' : ''}`}
                  onClick={() => toggleWatched(content.id)}
                >
                  {isWatched(content.id) ? '✅ Watched' : '👁️ Mark as Watched'}
                </button>
              )}

              {trailer && (
                <button
                  className="trailer-btn"
                  onClick={() => setShowTrailerModal(true)}
                >
                  ▶️ Watch Trailer
                </button>
              )}

              <ShareButtons title={title} />
            </div>

            {/* User Rating */}
            <div className="user-rating-section">
              <h4>Your Rating:</h4>
              <StarRating
                rating={userRating}
                onRate={handleRatingChange}
                size="large"
              />

              {!showReviewForm && !userReview && (
                <button
                  className="review-toggle-btn"
                  onClick={() => setShowReviewForm(true)}
                >
                  ✏️ Write a Review
                </button>
              )}

              {userReview && !showReviewForm && (
                <div className="user-review">
                  <p>"{userReview}"</p>
                  <button
                    className="review-edit-btn"
                    onClick={() => setShowReviewForm(true)}
                  >
                    Edit
                  </button>
                </div>
              )}

              {showReviewForm && (
                <div className="review-form">
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="What did you think of this movie?"
                    rows={3}
                  />
                  <div className="review-form-actions">
                    <button onClick={handleReviewSubmit}>Save Review</button>
                    <button onClick={() => setShowReviewForm(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cast Section */}
        {cast.length > 0 && (
          <section className="cast-section" aria-labelledby="cast-heading">
            <h3 id="cast-heading">🎭 Cast</h3>
            <div className="cast-grid">
              {cast.map((person) => (
                <div key={person.id} className="cast-member">
                  {person.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                      alt={person.name}
                      className="cast-photo"
                      loading="lazy"
                    />
                  ) : (
                    <div className="cast-photo-placeholder">👤</div>
                  )}
                  <div className="cast-info">
                    <p className="cast-name">{person.name}</p>
                    <p className="cast-character">{person.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trailer Section */}
        {trailer && (
          <section className="trailer-section" aria-labelledby="trailer-heading">
            <h3 id="trailer-heading">🎬 Watch Trailer</h3>
            <div className="trailer-container">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={`${title} trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </section>
        )}

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

      {/* Trailer Modal */}
      {showTrailerModal && trailer && (
        <TrailerModal
          videoKey={trailer.key}
          onClose={() => setShowTrailerModal(false)}
        />
      )}
    </main>
  );
}

export default MovieDetails;