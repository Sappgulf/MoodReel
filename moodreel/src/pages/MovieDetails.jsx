import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import ShareButtons from '../components/ShareButtons';
import StarRating from '../components/StarRating';
import TrailerModal from '../components/TrailerModal';
import ErrorState from '../components/ErrorState';
import { useWatchlist } from '../hooks/useWatchlist';
import { useRatings } from '../hooks/useRatings';
import { useAchievements } from '../hooks/useAchievements';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useTrailer } from '../context/TrailerContext';
import { useSounds } from '../hooks/useSounds';
import { useTasteProfile } from '../hooks/useTasteProfile';
import { useProviderSettings } from '../hooks/useProviderSettings';
import { Skeleton } from '../components/Skeleton';
import searchService from '../services/searchService';
import { getUserFacingMessage, isAbortError, shouldSkipLog } from '../services/apiErrorUtils';
import { getBackdropUrl, getDisplayOverview, getDisplayTitle, getPosterUrl, normalizeProviderList } from '../utils/mediaUtils';

function MovieDetails() {
  const { id } = useParams();
  const location = useLocation();
  const isTV = location.pathname.startsWith('/tv');
  const mediaType = isTV ? 'tv' : 'movie';
  const [requestNonce, setRequestNonce] = useState(0);
  const isValidId = typeof id === 'string' && /^\d+$/.test(id);

  const { addToHistory } = useWatchHistory();
  const { playTrailer } = useTrailer();
  const { playSound } = useSounds();
  const [content, setContent] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [providers, setProviders] = useState(null);
  const [allProviders, setAllProviders] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [cast, setCast] = useState([]);
  const [director, setDirector] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);
  const [actorFilmography, setActorFilmography] = useState([]);
  const [actorLoading, setActorLoading] = useState(false);
  const [actorError, setActorError] = useState('');
  const actorRequestRef = useRef(null);
  const actorRequestIdRef = useRef(0);

  const {
    isInWatchlist, toggleWatchlist,
    isWatched, toggleWatched
  } = useWatchlist();
  const { getRating, setRating, getReview, setReview } = useRatings();
  const { trackRating } = useAchievements();
  const { like, dislike, statusFor } = useTasteProfile();
  const { region } = useProviderSettings();

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
      setAllProviders(null);
      setTrailer(null);
      setCast([]);

      if (!isValidId) {
        setError('Invalid details URL. Please open a valid item.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await searchService.fetchContentDetails(id, mediaType, controller.signal);

        setContent(data.details);
        setSimilar(data.similar.slice(0, 6));

        // Get US providers or first available region
        const results = data.providers;
        setAllProviders(results || null);

        // Find YouTube trailer
        const videos = data.videos || [];
        const trailerVideo = videos.find(v =>
          v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        ) || videos.find(v => v.site === 'YouTube');
        setTrailer(trailerVideo || null);

        // Get top 6 cast members and director
        const castData = data.credits.cast || [];
        const crewData = data.credits.crew || [];
        setCast(castData.slice(0, 6));

        const dir = crewData.find(c => c.job === 'Director');
        setDirector(dir || null);

        // Track this view in history with credits for DNA feature
        addToHistory({ ...data.details, media_type: mediaType }, data.credits);

      } catch (err) {
        if (!isAbortError(err)) {
          setError(getUserFacingMessage(err) || 'Error fetching details.');
        }
        if (!shouldSkipLog(err)) {
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [id, mediaType, addToHistory, isValidId, requestNonce]);

  useEffect(() => {
    if (!allProviders) {
      setProviders(null);
      return;
    }
    setProviders(allProviders?.[region] || allProviders?.US || allProviders?.[Object.keys(allProviders || {})[0]] || null);
  }, [allProviders, region]);

  // Load saved review text (separate effect to avoid refetching on rating change)
  useEffect(() => {
    const savedReview = getReview(id);
    setReviewText(savedReview || '');
  }, [id, getReview]);

  // Cancel any in-flight actor fetch on unmount.
  useEffect(() => {
    return () => {
      actorRequestRef.current?.abort();
    };
  }, []);

  const renderStars = useCallback((rating) => {
    const stars = Math.round(rating / 2);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }, []);

  // Fetch actor filmography
  const handleActorClick = useCallback(async (actor) => {
    if (!actor?.id) return;

    const currentRequestId = ++actorRequestIdRef.current;
    actorRequestRef.current?.abort();
    const controller = new AbortController();
    actorRequestRef.current = controller;

    setSelectedActor(actor);
    setActorError('');
    setActorLoading(true);
    setActorFilmography([]);

    try {
      const response = await searchService.fetchActorCredits(actor.id, controller.signal);
      if (currentRequestId !== actorRequestIdRef.current || controller.signal.aborted) return;

      // Sort by popularity and filter out current movie
      const credits = response
        .filter(c => c.id !== parseInt(id) && (c.poster_path || c.backdrop_path))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 12);

      if (currentRequestId === actorRequestIdRef.current && !controller.signal.aborted) {
        setActorFilmography(credits);
      }
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      if (currentRequestId === actorRequestIdRef.current && !controller.signal.aborted) {
        setActorError(getUserFacingMessage(err) || 'Could not load actor filmography. Please try again.');
        setActorFilmography([]);
      }
      if (!shouldSkipLog(err)) {
        console.error('Error fetching actor filmography:', err);
      }
    } finally {
      if (currentRequestId === actorRequestIdRef.current && !controller.signal.aborted) {
        setActorLoading(false);
      }
    }
  }, [id]);

  const closeActorModal = useCallback(() => {
    actorRequestRef.current?.abort();
    setSelectedActor(null);
    setActorFilmography([]);
    setActorLoading(false);
    setActorError('');
  }, []);

  const handleToggleWatchlist = useCallback(() => {
    if (content) {
      toggleWatchlist({ ...content, media_type: mediaType });
    }
  }, [content, mediaType, toggleWatchlist]);

  const handleRatingChange = useCallback((rating) => {
    setRating(id, rating);
    trackRating(id); // Track for achievement system (unique movies only)
    playSound('pop');
  }, [id, setRating, trackRating, playSound]);

  const handleReviewSubmit = useCallback(() => {
    setReview(id, reviewText);
    setShowReviewForm(false);
    playSound('save');
  }, [id, reviewText, setReview, playSound]);

  const handleRetry = useCallback(() => {
    setRequestNonce((count) => count + 1);
  }, []);

  const providerGroups = useMemo(() => {
    if (!providers) return null;
    return {
      stream: normalizeProviderList(providers.flatrate || []),
      rent: normalizeProviderList(providers.rent || []),
      buy: normalizeProviderList(providers.buy || [])
    };
  }, [providers]);

  if (error) {
    return (
      <main role="main">
        <Link to="/" className="back-button">← Back to Discover</Link>
        <ErrorState
          title="Couldn't load details"
          message={error}
          onRetry={handleRetry}
        />
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

  const title = getDisplayTitle(content);
  const date = content.release_date || content.first_air_date;
  const year = date ? new Date(date).getFullYear() : '';
  const runtime = content.runtime || (content.episode_run_time?.[0]);
  const overview = getDisplayOverview(content);
  const tasteStatus = statusFor(content.id, mediaType);

  return (
    <main role="main" className="immersive-main">
      <div className="movie-details-backdrop">
        <img
          src={getBackdropUrl(content.backdrop_path)}
          alt=""
          className="backdrop-img"
          decoding="async"
          onError={(e) => e.target.style.display = 'none'}
        />
      </div>

      <Link to="/" className="back-button">
        ← Back to Discover
      </Link>

      <article className="movie-details">
        <div className="movie-details-header">
          {/* Poster */}
          <div className="poster-container">
            {content.poster_path ? (
              <img
                src={getPosterUrl(content.poster_path)}
                alt={`${title} poster`}
                decoding="async"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getPosterUrl();
                }}
              />
            ) : (
              <div className="no-poster">No Poster</div>
            )}
          </div>

          {/* Info */}
          <div className="movie-info">
            <h1>{title}</h1>

            <div className="meta-row">
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
              {director && (
                <span className="meta-item">
                  <span aria-hidden="true">🎬</span> Dir. {director.name}
                </span>
              )}
              <div className="rating-large" aria-label={`Rating: ${content.vote_average?.toFixed(1)} out of 10`}>
                <span className="stars" aria-hidden="true">{renderStars(content.vote_average)}</span>
                <span>{content.vote_average?.toFixed(1)}</span>
              </div>
            </div>

            <p className="overview">{overview}</p>

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
                <div className="trailer-actions">
                  <button
                    className="trailer-btn"
                    onClick={() => setShowTrailerModal(true)}
                  >
                    ▶️ Watch Trailer
                  </button>
                  <button
                    className="pip-button"
                    onClick={() => playTrailer(trailer.key, title)}
                    title="Watch in Picture-in-Picture"
                  >
                    📍 PiP Mode
                  </button>
                </div>
              )}

              <ShareButtons title={title} />
            </div>

            <div className="taste-profile-actions" role="group" aria-label="Taste profile">
              <button
                className={`taste-btn ${tasteStatus === 'liked' ? 'active' : ''}`}
                onClick={() => like(content, mediaType)}
                aria-pressed={tasteStatus === 'liked'}
              >
                👍 Like
              </button>
              <button
                className={`taste-btn ${tasteStatus === 'disliked' ? 'active' : ''}`}
                onClick={() => dislike(content, mediaType)}
                aria-pressed={tasteStatus === 'disliked'}
              >
                👎 Dislike
              </button>
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
                    type="button"
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
                    type="button"
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
                    <button type="button" onClick={handleReviewSubmit}>Save Review</button>
                    <button type="button" onClick={() => setShowReviewForm(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cast Section */}
        <section className="cast-section" aria-labelledby="cast-heading">
          <h3 id="cast-heading">🎭 Cast</h3>
          {cast.length > 0 ? (
            <div className="cast-grid">
              {cast.map((person) => (
                <div
                  key={person.id}
                  className="cast-member clickable"
                  onClick={() => handleActorClick(person)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleActorClick(person)}
                >
                  {person.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                      alt={person.name}
                      className="cast-photo"
                      loading="lazy"
                      decoding="async"
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
          ) : (
            <p className="filmography-empty">Cast list is not available for this title yet.</p>
          )}
        </section>

        {/* Trailer Section */}
        <section className="trailer-section" aria-labelledby="trailer-heading">
          <h3 id="trailer-heading">🎬 Watch Trailer</h3>
          {trailer ? (
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
          ) : (
            <p className="trailer-empty">Trailer unavailable right now.</p>
          )}
        </section>

        {/* Streaming Providers */}
        <section className="streaming-section" aria-labelledby="providers-heading">
          <h3 id="providers-heading">Where to Watch ({region})</h3>
          {providerGroups && (providerGroups.stream.length > 0 || providerGroups.rent.length > 0 || providerGroups.buy.length > 0) ? (
            <div className="streaming-providers">
              {providerGroups.stream.length > 0 && (
                <div className="provider-group">
                  <h4>Stream</h4>
                  <div className="provider-grid">
                    {providerGroups.stream.map((provider) => (
                      <img
                        key={`stream-${provider.id}`}
                        src={getPosterUrl(provider.logoPath, 'w92')}
                        alt={provider.name}
                        title={`Stream on ${provider.name}`}
                        className="provider-logo"
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                </div>
              )}
              {providerGroups.rent.length > 0 && (
                <div className="provider-group">
                  <h4>Rent</h4>
                  <div className="provider-grid">
                    {providerGroups.rent.map((provider) => (
                      <img
                        key={`rent-${provider.id}`}
                        src={getPosterUrl(provider.logoPath, 'w92')}
                        alt={provider.name}
                        title={`Rent on ${provider.name}`}
                        className="provider-logo"
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                </div>
              )}
              {providerGroups.buy.length > 0 && (
                <div className="provider-group">
                  <h4>Buy</h4>
                  <div className="provider-grid">
                    {providerGroups.buy.map((provider) => (
                      <img
                        key={`buy-${provider.id}`}
                        src={getPosterUrl(provider.logoPath, 'w92')}
                        alt={provider.name}
                        title={`Buy on ${provider.name}`}
                        className="provider-logo"
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="providers-empty">No provider data available for this title.</p>
          )}
        </section>

        {/* Similar Content */}
        <section className="similar-movies" aria-labelledby="similar-heading">
          <h3 id="similar-heading">You Might Also Like</h3>
          {similar.length > 0 ? (
            <div className="similar-movies-grid">
              {similar.map((item) => (
                <MovieCard
                  key={item.id}
                  movie={{ ...item, media_type: mediaType }}
                  isInWatchlist={isInWatchlist(item.id)}
                  onToggleWatchlist={toggleWatchlist}
                  isWatched={isWatched(item.id)}
                  onToggleWatched={toggleWatched}
                  mediaType={mediaType}
                  onLike={like}
                  onDislike={dislike}
                  tasteStatus={statusFor(item.id, mediaType)}
                />
              ))}
            </div>
          ) : (
            <p className="filmography-empty">No similar titles are available for this title.</p>
          )}
        </section>
      </article>

      {/* Trailer Modal */}
      {showTrailerModal && trailer && (
        <TrailerModal
          videoKey={trailer.key}
          onClose={() => setShowTrailerModal(false)}
        />
      )}

      {/* Actor Filmography Modal */}
      {selectedActor && (
        <div className="filmography-overlay" onClick={closeActorModal}>
          <div className="filmography-modal" onClick={e => e.stopPropagation()}>
            <button className="filmography-close" onClick={closeActorModal}>✕</button>
            <div className="filmography-header">
              {selectedActor.profile_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w185${selectedActor.profile_path}`}
                  alt={selectedActor.name}
                  className="filmography-actor-photo"
                />
              )}
              <div>
                <h3>{selectedActor.name}</h3>
                <p className="filmography-subtitle">Filmography</p>
              </div>
            </div>

            {actorLoading ? (
              <div className="filmography-loading">Loading filmography...</div>
            ) : actorError ? (
              <div className="filmography-empty">
                <p>{actorError}</p>
                <button type="button" className="review-edit-btn" onClick={() => handleActorClick(selectedActor)}>
                  Retry
                </button>
              </div>
            ) : actorFilmography.length > 0 ? (
              <div className="filmography-grid">
                {actorFilmography.map(credit => (
                  <Link
                    key={`${credit.id}-${credit.media_type}`}
                    to={`/${credit.media_type === 'tv' ? 'tv' : 'movie'}/${credit.id}`}
                    className="filmography-item"
                    onClick={() => setSelectedActor(null)}
                  >
                    {credit.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w154${credit.poster_path}`}
                        alt={credit.title || credit.name}
                        className="filmography-poster"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="filmography-poster-placeholder">🎬</div>
                    )}
                    <p className="filmography-title">{credit.title || credit.name}</p>
                    <p className="filmography-role">{credit.character || credit.job}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="filmography-empty">No other credits found</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default MovieDetails;
