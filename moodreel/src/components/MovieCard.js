import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Premium movie card component with poster, info, watchlist button, and 3D parallax effect
 * Memoized to prevent unnecessary re-renders
 */
const MovieCard = memo(function MovieCard({
    movie,
    isInWatchlist,
    onToggleWatchlist,
    isWatched,
    onToggleWatched,
    mediaType = 'movie',
    onSwipeRight,
    onSwipeLeft
}) {
    const title = movie.title || movie.name;
    const date = movie.release_date || movie.first_air_date;
    const year = date ? new Date(date).getFullYear() : '';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
    const detailPath = mediaType === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`;

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
            const handler = (event) => {
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

    const handleWatchlistClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.vibrate) navigator.vibrate(5);
        onToggleWatchlist(movie);
    }, [movie, onToggleWatchlist]);

    const handleWatchedClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleWatched) {
            if (navigator.vibrate) navigator.vibrate(5);
            onToggleWatched(movie.id);
        }
    }, [movie.id, onToggleWatched]);

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

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current || reduceMotionRef.current) return;

        const rect = rectRef.current || cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        applyTilt(rotateX, rotateY);
    }, [applyTilt]);

    const handleMouseLeave = useCallback(() => {
        rectRef.current = null;
        applyTilt(0, 0);
    }, [applyTilt]);

    // Swipe gestures for mobile
    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
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

    const swipeOpacity = swipeOffset !== 0
        ? Math.max(0.5, 1 - Math.abs(swipeOffset) / 300)
        : 1;

    const cardStyle = {
        '--swipe-x': `${swipeOffset}px`,
        '--swipe-rot': `${swipeOffset * 0.05}deg`,
        opacity: swipeOpacity,
        ...(swipeOffset !== 0 ? { transition: 'none' } : {})
    };

    return (
        <div
            ref={cardRef}
            className="recommendation fade-in parallax-card"
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
                <div className="swipe-feedback swipe-right" style={{ opacity: Math.min(1, swipeOffset / 100) }}>
                    ❤️
                </div>
            )}
            {swipeOffset < -20 && (
                <div className="swipe-feedback swipe-left" style={{ opacity: Math.min(1, -swipeOffset / 100) }}>
                    👎
                </div>
            )}

            <div className="card-actions">
                <button
                    className={`watchlist-btn ${isInWatchlist ? 'active' : ''}`}
                    onClick={handleWatchlistClick}
                    aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                    aria-pressed={isInWatchlist}
                >
                    {isInWatchlist ? '❤️' : '🤍'}
                </button>

                {onToggleWatched && (
                    <button
                        className={`watched-card-btn ${isWatched ? 'active' : ''}`}
                        onClick={handleWatchedClick}
                        aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                        aria-pressed={isWatched}
                    >
                        {isWatched ? '✅' : '👁️'}
                    </button>
                )}
            </div>

            <Link to={detailPath}>
                <div className="poster-wrapper">
                    {movie.poster_path ? (
                        <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={`${title} poster`}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
                            }}
                        />
                    ) : (
                        <div className="no-poster">No Poster</div>
                    )}
                </div>

                <div className="card-content">
                    <h2>{title}</h2>
                    <p className="release-date">{year}</p>
                    {rating && (
                        <div className="rating" aria-label={`Rating: ${rating} out of 10`}>
                            <span aria-hidden="true">⭐</span>
                            <span>{rating}</span>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
});

export default MovieCard;
