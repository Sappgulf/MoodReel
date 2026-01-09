import React, { memo, useCallback, useState, useRef } from 'react';
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

    // Parallax state
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const cardRef = useRef(null);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);
    const [swipeOffset, setSwipeOffset] = useState(0);

    const handleWatchlistClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleWatchlist(movie);
    }, [movie, onToggleWatchlist]);

    const handleWatchedClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleWatched) {
            onToggleWatched(movie.id);
        }
    }, [movie.id, onToggleWatched]);

    // 3D parallax tilt on mouse move
    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        setTilt({ x: rotateX, y: rotateY });
    }, []);

    const handleMouseEnter = useCallback(() => {
        setIsHovering(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovering(false);
        setTilt({ x: 0, y: 0 });
    }, []);

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
            onSwipeRight(movie);
        } else if (swipeOffset < -threshold && onSwipeLeft) {
            onSwipeLeft(movie);
        }

        touchStartX.current = null;
        setSwipeOffset(0);
    };

    const cardStyle = isHovering ? {
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(20px)`,
        transition: 'transform 0.1s ease-out'
    } : {
        transform: `perspective(1000px) rotateX(0) rotateY(0) translateZ(0) translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg)`,
        transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
        opacity: swipeOffset !== 0 ? Math.max(0.5, 1 - Math.abs(swipeOffset) / 300) : 1
    };

    return (
        <div
            ref={cardRef}
            className="recommendation fade-in parallax-card"
            style={cardStyle}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
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
