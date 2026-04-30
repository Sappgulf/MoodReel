import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProviderBadges from './ProviderBadges';
import { getDisplayTitle, getPosterUrl, getReleaseYear } from '../utils/mediaUtils';
import { useSounds } from '../hooks/useSounds';

/**
 * Premium movie card component with poster, info, watchlist button, and 3D parallax effect
 * Memoized to prevent unnecessary re-renders
 */
const MovieCard = memo(function MovieCard({
  movie,
  isInWatchlist,
  onToggleWatchlist,
  isFavorite,
  onToggleFavorite,
  isWatched,
  onToggleWatched,
  mediaType = 'movie',
  onSwipeRight,
  onSwipeLeft,
  providerBadges = [],
  reason = '',
  onLike,
  onDislike,
  tasteStatus = 'neutral',
  index = 0,
  displayMode = 'poster',
  className = '',
}) {
  const { playSound } = useSounds();
  const title = getDisplayTitle(movie);
  const year = getReleaseYear(movie);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const resolvedMediaType = movie.media_type || mediaType;
  const detailPath = resolvedMediaType === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`;
  const posterPath = movie.poster_path;
  // Use w342 for fast initial paint on first visible rows, w500 for deeper items
  const posterSize = posterPath ? (index < 8 ? 'w342' : 'w500') : 'w500';
  // Responsive srcset for crisp rendering on retina displays
  const posterSrcSet = posterPath
    ? `https://image.tmdb.org/t/p/w342${posterPath} 342w, https://image.tmdb.org/t/p/w500${posterPath} 500w, https://image.tmdb.org/t/p/w780${posterPath} 780w`
    : undefined;

  const cardRef = useRef(null);
  const touchStartX = useRef(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const rafRef = useRef(null);
  const tiltRef = useRef({ x: 0, y: 0 });
  const rectRef = useRef(null);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    if (window.matchMedia) {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      reduceMotionRef.current = media.matches;
      const handler = event => {
        reduceMotionRef.current = event.matches;
      };
      if (media.addEventListener) {
        media.addEventListener('change', handler);
        return () => media.removeEventListener('change', handler);
      }
      media.addListener(handler);
      return () => media.removeListener(handler);
    }
    return undefined;
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleWatchlistClick = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(5);
      onToggleWatchlist(movie);
      playSound('click');
    },
    [movie, onToggleWatchlist, playSound]
  );

  const handleFavoriteClick = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(5);
      onToggleFavorite(movie);
      playSound('click');
    },
    [movie, onToggleFavorite, playSound]
  );

  const handleWatchedClick = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(5);
      onToggleWatched(movie.id);
      playSound('click');
    },
    [movie.id, onToggleWatched, playSound]
  );

  const handleLike = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      if (onLike) {
        onLike(movie, mediaType);
        playSound('pop');
      }
    },
    [movie, mediaType, onLike, playSound]
  );

  const handleDislike = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      if (onDislike) {
        onDislike(movie, mediaType);
        playSound('swipe');
      }
    },
    [movie, mediaType, onDislike, playSound]
  );

  // 3D parallax tilt on mouse move
  const applyTilt = useCallback((x, y) => {
    tiltRef.current = { x, y };
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!cardRef.current) return;
      cardRef.current.style.setProperty('--tilt-x', `${tiltRef.current.x}deg`);
      cardRef.current.style.setProperty('--tilt-y', `${tiltRef.current.y}deg`);
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current) return;
    rectRef.current = cardRef.current.getBoundingClientRect();
  }, []);

  const handleMouseMove = useCallback(
    e => {
      if (!cardRef.current || reduceMotionRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      applyTilt(rotateX, rotateY);
    },
    [applyTilt]
  );

  const handleMouseLeave = useCallback(() => {
    rectRef.current = null;
    applyTilt(0, 0);
  }, [applyTilt]);

  // Swipe gestures for mobile
  const handleTouchStart = e => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = e => {
    if (touchStartX.current === null) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStartX.current;

    // Only track horizontal movement
    if (Math.abs(diff) > 20) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;

    const threshold = 100;
    if (swipeOffset > threshold && onSwipeRight) {
      if (navigator.vibrate) navigator.vibrate(10); // Subtle tick
      onSwipeRight(movie);
    } else if (swipeOffset < -threshold && onSwipeLeft) {
      if (navigator.vibrate) navigator.vibrate(10); // Subtle tick
      onSwipeLeft(movie);
    }

    touchStartX.current = null;
    setSwipeOffset(0);
  };

  const swipeOpacity = swipeOffset !== 0 ? Math.max(0.5, 1 - Math.abs(swipeOffset) / 300) : 1;

  const cardStyle = {
    '--swipe-x': `${swipeOffset}px`,
    '--swipe-rot': `${swipeOffset * 0.05}deg`,
    opacity: swipeOpacity,
    willChange: 'transform',
    ...(swipeOffset !== 0 ? { transition: 'none' } : {}),
  };

  const isRowMode = displayMode === 'row';
  const linkClassName = `swipe-card-link ${isRowMode ? 'swipe-card-link-row' : ''}`;
  const modeClassName = isRowMode ? 'recommendation-row-mode' : '';

  return (
    <div
      ref={cardRef}
      className={`recommendation fade-in parallax-card glint ${modeClassName} stagger-${(index % 5) + 1} ${className}`}
      style={cardStyle}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Visual feedback for swipe */}
      {swipeOffset > 20 && (
        <div
          className="swipe-feedback swipe-right"
          style={{ opacity: Math.min(1, swipeOffset / 100) }}
        >
          ❤️
        </div>
      )}
      {swipeOffset < -20 && (
        <div
          className="swipe-feedback swipe-left"
          style={{ opacity: Math.min(1, -swipeOffset / 100) }}
        >
          👎
        </div>
      )}

      <div className="card-actions">
        <button
          type="button"
          className={`watchlist-btn ${isInWatchlist ? 'active' : ''}`}
          onClick={handleWatchlistClick}
          aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          aria-pressed={isInWatchlist}
          title="Watchlist"
        >
          {isInWatchlist ? '🔖' : '📑'}
        </button>

        {onToggleFavorite && (
          <button
            type="button"
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            title="Favorites"
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        )}

        {onToggleWatched && (
          <button
            type="button"
            className={`watched-card-btn ${isWatched ? 'active' : ''}`}
            onClick={handleWatchedClick}
            aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
            aria-pressed={isWatched}
          >
            {isWatched ? '✅' : '👁️'}
          </button>
        )}

        {(onLike || onDislike) && (
          <div className="taste-actions" role="group" aria-label="Taste profile">
            <button
              type="button"
              className={`taste-btn ${tasteStatus === 'liked' ? 'active' : ''}`}
              onClick={handleLike}
              aria-label="Like this title"
              title="Like"
              aria-pressed={tasteStatus === 'liked'}
            >
              👍
            </button>
            <button
              type="button"
              className={`taste-btn ${tasteStatus === 'disliked' ? 'active' : ''}`}
              onClick={handleDislike}
              aria-label="Dislike this title"
              title="Dislike"
              aria-pressed={tasteStatus === 'disliked'}
            >
              👎
            </button>
          </div>
        )}
      </div>

      <Link
        to={detailPath}
        state={{ item: { ...movie, media_type: resolvedMediaType } }}
        className={linkClassName}
      >
        <div className="poster-wrapper">
          <img
            src={getPosterUrl(posterPath, posterSize)}
            srcSet={posterSrcSet}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            alt={`${title} poster`}
            loading={index < 8 ? 'eager' : 'lazy'}
            decoding="async"
            onError={e => {
              e.target.onerror = null;
              e.target.removeAttribute('srcset');
              e.target.src = getPosterUrl();
            }}
          />
        </div>

        <div className="card-content">
          <div className="card-copy">
            <h2>{title}</h2>
            <p className="release-date">{year}</p>
          </div>
          {isRowMode && movie.overview ? (
            <p className="card-overview">{movie.overview.slice(0, 120)}</p>
          ) : null}
          {reason && <p className="recommendation-reason">{reason}</p>}
          <div className="card-footer">
            {rating && (
              <div className="rating" aria-label={`Rating: ${rating} out of 10`}>
                <span aria-hidden="true">⭐</span>
                <span>{rating}</span>
              </div>
            )}
            <ProviderBadges providers={providerBadges} />
          </div>
        </div>
      </Link>
    </div>
  );
});

export default MovieCard;
