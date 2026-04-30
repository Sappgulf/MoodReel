import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import MediaImage from '../components/MediaImage';
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
import { useModalDialog } from '../hooks/useModalDialog';
import { Skeleton } from '../components/Skeleton';
import searchService from '../services/searchService';
import { getUserFacingMessage, isAbortError, shouldSkipLog } from '../services/apiErrorUtils';
import { getDisplayOverview, getDisplayTitle, normalizeProviderList } from '../utils/mediaUtils';

function MovieDetails() {
  const { id } = useParams();
  const location = useLocation();
  const isTV = location.pathname.startsWith('/tv');
  const mediaType = isTV ? 'tv' : 'movie';
  const routedItem = location.state?.item || null;
  const [requestNonce, setRequestNonce] = useState(0);
  const isValidId = typeof id === 'string' && /^\d+$/.test(id);

  const { history: watchHistory, addToHistory } = useWatchHistory();
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
  const [isLimitedDetails, setIsLimitedDetails] = useState(false);
  const actorRequestRef = useRef(null);
  const actorRequestIdRef = useRef(0);
  const actorDialogCloseRef = useRef(null);

  const { isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useWatchlist();
  const { getRating, setRating, getReview, setReview } = useRatings();
  const { trackRating } = useAchievements();
  const { like, dislike, statusFor } = useTasteProfile();
  const { region } = useProviderSettings();

  // Get stored rating/review
  const userRating = getRating(id);
  const userReview = getReview(id);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      setContent(null);
      setSimilar([]);
      setProviders(null);
      setAllProviders(null);
      setTrailer(null);
      setCast([]);
      setDirector(null);
      setIsLimitedDetails(false);

      if (!isValidId) {
        setError('Invalid details URL. Please open a valid item.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await searchService.fetchContentDetails(id, mediaType, controller.signal);
        if (!mounted || controller.signal.aborted) return;

        const details =
          data.details || (routedItem ? { ...routedItem, media_type: mediaType } : null);
        if (!details) {
          setError(
            'This title did not return usable details. Please try again or pick another result.'
          );
          return;
        }

        setContent(details);
        setIsLimitedDetails(!data.details);
        setSimilar((data.similar || []).slice(0, 6));

        // Get region providers or first available region
        const results = data.providers;
        setAllProviders(results || null);

        // Find YouTube trailer
        const videos = data.videos || [];
        const trailerVideo =
          videos.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) ||
          videos.find(v => v.site === 'YouTube');
        setTrailer(trailerVideo || null);

        // Get top 6 cast members and director
        const credits = data.credits || { cast: [], crew: [] };
        const castData = credits.cast || [];
        const crewData = credits.crew || [];
        setCast(castData.slice(0, 6));

        const dir = crewData.find(c => c.job === 'Director');
        setDirector(dir || null);

        // Track this view in history with credits for DNA feature
        addToHistory({ ...details, media_type: mediaType }, credits);
      } catch (err) {
        if (!mounted || controller.signal.aborted) return;
        if (routedItem) {
          setContent({ ...routedItem, media_type: mediaType });
          setIsLimitedDetails(true);
          setSimilar([]);
          setProviders(null);
          setAllProviders(null);
          setTrailer(null);
          setCast([]);
          setDirector(null);
          addToHistory({ ...routedItem, media_type: mediaType }, { cast: [], crew: [] });
          return;
        }
        if (!isAbortError(err)) {
          setError(getUserFacingMessage(err) || 'Error fetching details.');
        }
        if (!shouldSkipLog(err)) {
          console.error(err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [id, mediaType, addToHistory, isValidId, requestNonce, routedItem]);

  useEffect(() => {
    if (!allProviders) {
      setProviders(null);
      return;
    }
    setProviders(
      allProviders?.[region] ||
        allProviders?.US ||
        allProviders?.[Object.keys(allProviders || {})[0]] ||
        null
    );
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

  const renderStars = useCallback(rating => {
    const stars = Math.round(rating / 2);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }, []);

  // Fetch actor filmography
  const handleActorClick = useCallback(
    async actor => {
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
          setActorError(
            getUserFacingMessage(err) || 'Could not load actor filmography. Please try again.'
          );
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
    },
    [id]
  );

  const closeActorModal = useCallback(() => {
    actorRequestRef.current?.abort();
    setSelectedActor(null);
    setActorFilmography([]);
    setActorLoading(false);
    setActorError('');
  }, []);

  const { dialogRef: actorDialogRef } = useModalDialog({
    isOpen: Boolean(selectedActor),
    onClose: closeActorModal,
    focusRef: actorDialogCloseRef,
  });

  const handleToggleWatchlist = useCallback(() => {
    if (content) {
      toggleWatchlist({ ...content, media_type: mediaType });
    }
  }, [content, mediaType, toggleWatchlist]);

  const handleRatingChange = useCallback(
    rating => {
      setRating(id, rating);
      trackRating(id); // Track for achievement system (unique movies only)
      playSound('pop');
    },
    [id, setRating, trackRating, playSound]
  );

  const handleReviewSubmit = useCallback(() => {
    setReview(id, reviewText);
    setShowReviewForm(false);
    playSound('save');
  }, [id, reviewText, setReview, playSound]);

  const handleRetry = useCallback(() => {
    setRequestNonce(count => count + 1);
  }, []);

  const providerGroups = useMemo(() => {
    if (!providers) return null;
    return {
      stream: normalizeProviderList(providers.flatrate || []),
      rent: normalizeProviderList(providers.rent || []),
      buy: normalizeProviderList(providers.buy || []),
    };
  }, [providers]);

  const whyYouMightLikeIt = useMemo(() => {
    if (!content) return [];
    const reasons = [];
    const status = statusFor(content.id, mediaType);
    if (status === 'liked') {
      reasons.push(
        'You marked this as a liked title, so similar picks will stay closer to this lane.'
      );
    }
    if (isLimitedDetails) {
      reasons.push(
        'This page is using saved card data while live details are temporarily unavailable.'
      );
    }
    if (director) {
      reasons.push(
        `Directed by ${director.name}, with cast and similar-title context used for future ranking.`
      );
    }
    const sameTypeViews = watchHistory.filter(item => item.media_type === mediaType).length;
    if (sameTypeViews > 1) {
      reasons.push(
        `You have opened ${sameTypeViews} ${mediaType === 'tv' ? 'series' : 'movies'} recently, so this format is boosted.`
      );
    }
    if (content.vote_average >= 8) {
      reasons.push('TMDB viewers rate this strongly.');
    }
    if (reasons.length === 0) {
      reasons.push('It matched the discovery filters that brought you here.');
    }
    return reasons.slice(0, 3);
  }, [content, director, isLimitedDetails, mediaType, statusFor, watchHistory]);

  const tasteIntel = useMemo(() => {
    const viewedCast = new Set(watchHistory.flatMap(item => item.cast || []));
    const viewedDirectors = new Set(watchHistory.flatMap(item => item.directors || []));
    const castMatches = cast.filter(person => viewedCast.has(person.name)).slice(0, 3);
    const directorMatch = director && viewedDirectors.has(director.name) ? director.name : '';
    const normalizedReview = (userReview || reviewText || '').toLowerCase();
    const positiveWords = ['love', 'great', 'fun', 'beautiful', 'favorite', 'excellent'];
    const criticalWords = ['slow', 'boring', 'bad', 'weak', 'confusing', 'disappointing'];
    const positiveHits = positiveWords.filter(word => normalizedReview.includes(word)).length;
    const criticalHits = criticalWords.filter(word => normalizedReview.includes(word)).length;

    let reviewSentiment = 'No review notes yet';
    if (normalizedReview) {
      if (positiveHits > criticalHits) reviewSentiment = 'Your notes lean positive';
      else if (criticalHits > positiveHits) reviewSentiment = 'Your notes flag some friction';
      else reviewSentiment = 'Your notes are balanced';
    }

    return {
      castMatches,
      directorMatch,
      reviewSentiment,
      hasSignals: castMatches.length > 0 || Boolean(directorMatch) || Boolean(normalizedReview),
    };
  }, [cast, director, reviewText, userReview, watchHistory]);

  if (error) {
    return (
      <main role="main">
        <Link to="/" className="back-button">
          ← Back to Discover
        </Link>
        <ErrorState title="Couldn't load details" message={error} onRetry={handleRetry} />
      </main>
    );
  }

  if (isLoading) {
    return (
      <main role="main">
        <Link to="/" className="back-button">
          ← Back to Discover
        </Link>
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
    return (
      <main role="main">
        <Link to="/" className="back-button">
          ← Back to Discover
        </Link>
        <ErrorState
          title="Couldn't load details"
          message="This title did not return usable details. Please try again or pick another result."
          onRetry={handleRetry}
        />
      </main>
    );
  }

  const title = getDisplayTitle(content);
  const date = content.release_date || content.first_air_date;
  const year = date ? new Date(date).getFullYear() : '';
  const runtime = content.runtime || content.episode_run_time?.[0];
  const overview = getDisplayOverview(content);
  const tasteStatus = statusFor(content.id, mediaType);
  const tagline = content.tagline ? `“${content.tagline}”` : '';
  const runtimeLabel = runtime ? `${runtime} min` : '';
  const genresText = content.genres?.map(genre => genre.name).join(' • ') || '';
  const ratingText = content.vote_average ? content.vote_average.toFixed(1) : '';
  const seasonLabel =
    isTV && content.number_of_seasons
      ? `${content.number_of_seasons} season${content.number_of_seasons > 1 ? 's' : ''}`
      : '';
  const backdropSources = [
    content.backdrop_path
      ? { path: content.backdrop_path, type: 'backdrop', size: 'original' }
      : null,
    content.poster_path ? { path: content.poster_path, type: 'poster', size: 'w780' } : null,
  ].filter(Boolean);

  return (
    <main role="main" className="immersive-main">
      <div className="movie-details-backdrop">
        <MediaImage
          type="backdrop"
          path={content.backdrop_path || content.poster_path}
          size={content.backdrop_path ? 'original' : 'w780'}
          sources={backdropSources}
          alt=""
          className="backdrop-img"
          loading="eager"
        />
      </div>

      <Link to="/" className="back-button">
        ← Back to Discover
      </Link>

      <article className="movie-details">
        <section className="movie-details-hero-panel glass-panel">
          <div className="movie-details-header">
            {/* Poster */}
            <div className="poster-container">
              <MediaImage path={content.poster_path} alt={`${title} poster`} loading="eager" />
            </div>

            {/* Info */}
            <div className="movie-info">
              <p className="movie-details-eyebrow">{isTV ? 'TV Title' : 'Movie'}</p>
              <h1>{title}</h1>
              {isLimitedDetails && (
                <div className="limited-details-banner" role="status">
                  <span>Limited details</span>
                  <p>
                    Showing saved card data while live TMDB details are unavailable. Watchlist,
                    taste, and sharing still work.
                  </p>
                  <button type="button" className="text-button" onClick={handleRetry}>
                    Retry live details
                  </button>
                </div>
              )}
              {tagline && <p className="movie-tagline">{tagline}</p>}
              <p className="overview">{overview}</p>

              <dl className="movie-facts-strip" aria-label="Quick facts">
                {year && (
                  <>
                    <dt>Year</dt>
                    <dd>{year}</dd>
                  </>
                )}
                {runtimeLabel && (
                  <>
                    <dt>Runtime</dt>
                    <dd>{runtimeLabel}</dd>
                  </>
                )}
                {seasonLabel && (
                  <>
                    <dt>Seasons</dt>
                    <dd>{seasonLabel}</dd>
                  </>
                )}
                {director && (
                  <>
                    <dt>Director</dt>
                    <dd>{director.name}</dd>
                  </>
                )}
                {genresText && (
                  <>
                    <dt>Genres</dt>
                    <dd>{genresText}</dd>
                  </>
                )}
                {ratingText && (
                  <>
                    <dt>TMDB</dt>
                    <dd>
                      <span className="rating-large" aria-label={`Rating: ${ratingText} out of 10`}>
                        <span className="stars" aria-hidden="true">
                          {renderStars(content.vote_average)}
                        </span>
                        <span>{ratingText}</span>
                      </span>
                    </dd>
                  </>
                )}
              </dl>

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
                    <button className="trailer-btn" onClick={() => setShowTrailerModal(true)}>
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
                <StarRating rating={userRating} onRate={handleRatingChange} size="large" />

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
                      onChange={e => setReviewText(e.target.value)}
                      placeholder="What did you think of this movie?"
                      rows={3}
                    />
                    <div className="review-form-actions">
                      <button type="button" onClick={handleReviewSubmit}>
                        Save Review
                      </button>
                      <button type="button" onClick={() => setShowReviewForm(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="why-like-section details-section" aria-labelledby="why-like-heading">
          <header className="details-section-head">
            <p className="details-kicker">Taste Signal</p>
            <h3 id="why-like-heading">Why you might like it</h3>
          </header>
          <ul className="why-like-list">
            {whyYouMightLikeIt.map(reason => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>

        <section
          className="taste-intel-section details-section"
          aria-labelledby="taste-intel-heading"
        >
          <header className="details-section-head">
            <p className="details-kicker">Taste Intelligence</p>
            <h3 id="taste-intel-heading">Your signal on this title</h3>
          </header>
          <div className="taste-intel-grid">
            <div className="taste-intel-card">
              <span>Cast affinity</span>
              <strong>
                {tasteIntel.castMatches.length > 0
                  ? tasteIntel.castMatches.map(person => person.name).join(', ')
                  : 'No repeated cast yet'}
              </strong>
            </div>
            <div className="taste-intel-card">
              <span>Director affinity</span>
              <strong>{tasteIntel.directorMatch || 'No director repeat yet'}</strong>
            </div>
            <div className="taste-intel-card">
              <span>Review sentiment</span>
              <strong>{tasteIntel.reviewSentiment}</strong>
            </div>
          </div>
          {!tasteIntel.hasSignals && (
            <p className="taste-intel-empty">
              Open more details pages or write a review to make this section more personal.
            </p>
          )}
        </section>

        {/* Cast Section */}
        <section className="cast-section details-section" aria-labelledby="cast-heading">
          <header className="details-section-head">
            <p className="details-kicker">Chapter One</p>
            <h3 id="cast-heading">Cast</h3>
          </header>
          {cast.length > 0 ? (
            <div className="cast-grid cast-grid-strip" role="list" aria-label="Cast members">
              {cast.map(person => (
                <button
                  key={person.id}
                  className="cast-member clickable"
                  type="button"
                  onClick={() => handleActorClick(person)}
                  aria-label={`${person.name} — ${person.character || 'Cast and crew member'}`}
                >
                  {person.profile_path ? (
                    <MediaImage
                      path={person.profile_path}
                      size="w185"
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
                </button>
              ))}
            </div>
          ) : (
            <p className="filmography-empty">Cast list is not available for this title yet.</p>
          )}
        </section>

        {/* Trailer Section */}
        <section className="trailer-section details-section" aria-labelledby="trailer-heading">
          <header className="details-section-head">
            <p className="details-kicker">Chapter Two</p>
            <h3 id="trailer-heading">Watch Trailer</h3>
          </header>
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
        <section className="streaming-section details-section" aria-labelledby="providers-heading">
          <header className="details-section-head">
            <p className="details-kicker">Chapter Three</p>
            <h3 id="providers-heading">Where to Watch ({region})</h3>
          </header>
          {providerGroups &&
          (providerGroups.stream.length > 0 ||
            providerGroups.rent.length > 0 ||
            providerGroups.buy.length > 0) ? (
            <div className="streaming-providers">
              {providerGroups.stream.length > 0 && (
                <div className="provider-group">
                  <h4>Stream</h4>
                  <div className="provider-grid">
                    {providerGroups.stream.map(provider => (
                      <MediaImage
                        key={`stream-${provider.id}`}
                        path={provider.logoPath}
                        size="w92"
                        alt={provider.name}
                        title={`Stream on ${provider.name}`}
                        className="provider-logo"
                        loading="lazy"
                      />
                    ))}
                  </div>
                </div>
              )}
              {providerGroups.rent.length > 0 && (
                <div className="provider-group">
                  <h4>Rent</h4>
                  <div className="provider-grid">
                    {providerGroups.rent.map(provider => (
                      <MediaImage
                        key={`rent-${provider.id}`}
                        path={provider.logoPath}
                        size="w92"
                        alt={provider.name}
                        title={`Rent on ${provider.name}`}
                        className="provider-logo"
                        loading="lazy"
                      />
                    ))}
                  </div>
                </div>
              )}
              {providerGroups.buy.length > 0 && (
                <div className="provider-group">
                  <h4>Buy</h4>
                  <div className="provider-grid">
                    {providerGroups.buy.map(provider => (
                      <MediaImage
                        key={`buy-${provider.id}`}
                        path={provider.logoPath}
                        size="w92"
                        alt={provider.name}
                        title={`Buy on ${provider.name}`}
                        className="provider-logo"
                        loading="lazy"
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
        <section className="similar-movies details-section" aria-labelledby="similar-heading">
          <header className="details-section-head">
            <p className="details-kicker">Chapter Four</p>
            <h3 id="similar-heading">You Might Also Like</h3>
          </header>
          {similar.length > 0 ? (
            <div
              className="similar-movies-grid similar-movies-grid-strip filmstrip"
              role="list"
              aria-label="Similar titles to watch next"
            >
              {similar.map(item => (
                <article className="filmstrip-item" role="listitem" key={item.id}>
                  <MovieCard
                    movie={{ ...item, media_type: mediaType }}
                    isInWatchlist={isInWatchlist(item.id)}
                    onToggleWatchlist={toggleWatchlist}
                    isWatched={isWatched(item.id)}
                    onToggleWatched={toggleWatched}
                    displayMode="row"
                    mediaType={mediaType}
                    onLike={like}
                    onDislike={dislike}
                    tasteStatus={statusFor(item.id, mediaType)}
                  />
                </article>
              ))}
            </div>
          ) : (
            <p className="filmography-empty">No similar titles are available for this title.</p>
          )}
        </section>
      </article>

      {/* Trailer Modal */}
      {showTrailerModal && trailer && (
        <TrailerModal videoKey={trailer.key} onClose={() => setShowTrailerModal(false)} />
      )}

      {/* Actor Filmography Modal */}
      {selectedActor && (
        <div className="filmography-overlay" onClick={closeActorModal}>
          <div
            className="filmography-modal"
            ref={actorDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filmography-heading"
            onClick={e => e.stopPropagation()}
          >
            <button
              ref={actorDialogCloseRef}
              className="filmography-close"
              type="button"
              aria-label="Close filmography"
              onClick={closeActorModal}
            >
              ✕
            </button>
            <div className="filmography-header">
              {selectedActor.profile_path && (
                <MediaImage
                  path={selectedActor.profile_path}
                  size="w185"
                  alt={selectedActor.name}
                  className="filmography-actor-photo"
                />
              )}
              <div>
                <h3 id="filmography-heading">{selectedActor.name}</h3>
                <p className="filmography-subtitle">Filmography</p>
              </div>
            </div>

            {actorLoading ? (
              <div className="filmography-loading">Loading filmography...</div>
            ) : actorError ? (
              <div className="filmography-empty">
                <p>{actorError}</p>
                <button
                  type="button"
                  className="review-edit-btn"
                  onClick={() => handleActorClick(selectedActor)}
                >
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
                    onClick={closeActorModal}
                  >
                    {credit.poster_path ? (
                      <MediaImage
                        path={credit.poster_path}
                        size="w154"
                        alt={credit.title || credit.name}
                        className="filmography-poster"
                        loading="lazy"
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
