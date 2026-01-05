import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';

const SWIPE_THRESHOLD = 100;

function SwipeCard({ movie, nextMovie, onSwipeLeft, onSwipeRight, mediaType }) {
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isExiting, setIsExiting] = useState(null);
    const startX = useRef(0);
    const cardRef = useRef(null);

    // Reset animation state when movie changes (new card appears)
    useEffect(() => {
        setOffset(0);
        setIsDragging(false);
        setIsExiting(null);
    }, [movie?.id]);

    // Preload next movie's poster image
    useEffect(() => {
        if (nextMovie?.poster_path) {
            const img = new Image();
            img.src = `https://image.tmdb.org/t/p/w342${nextMovie.poster_path}`;
        }
    }, [nextMovie?.poster_path]);

    // Keyboard support for swiping
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only act if not in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                triggerSwipe('right');
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                triggerSwipe('left');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movie, onSwipeLeft, onSwipeRight]);

    const triggerSwipe = useCallback((direction) => {
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        setIsExiting(direction);
        setTimeout(() => {
            if (direction === 'right') {
                onSwipeRight?.(movie);
            } else {
                onSwipeLeft?.(movie);
            }
        }, 300);
    }, [movie, onSwipeLeft, onSwipeRight]);

    const title = movie.title || movie.name;
    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
        : null;
    const detailPath = mediaType === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`;

    const handleTouchStart = useCallback((e) => {
        startX.current = e.touches[0].clientX;
        setIsDragging(true);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;
        setOffset(diff);
    }, [isDragging]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);

        if (offset > SWIPE_THRESHOLD) {
            triggerSwipe('right');
        } else if (offset < -SWIPE_THRESHOLD) {
            triggerSwipe('left');
        } else {
            setOffset(0);
        }
    }, [offset, triggerSwipe]);

    const rotation = offset * 0.05;
    const opacity = 1 - Math.abs(offset) / 300;

    const style = {
        transform: isExiting
            ? `translateX(${isExiting === 'right' ? '150%' : '-150%'}) rotate(${isExiting === 'right' ? 15 : -15}deg)`
            : `translateX(${offset}px) rotate(${rotation}deg)`,
        opacity: isExiting ? 0 : opacity,
        transition: isDragging ? 'none' : 'all 0.3s ease-out',
    };

    return (
        <div
            ref={cardRef}
            className="swipe-card"
            style={style}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            tabIndex={0}
            role="button"
            aria-label={`${title}. Press left arrow to pass, right arrow to save.`}
        >
            {/* Swipe indicators */}
            <div className={`swipe-indicator left ${offset < -30 ? 'visible' : ''}`}>
                ❌ PASS
            </div>
            <div className={`swipe-indicator right ${offset > 30 ? 'visible' : ''}`}>
                💚 SAVE
            </div>

            <Link to={detailPath} className="swipe-card-link">
                {posterUrl ? (
                    <img src={posterUrl} alt={title} loading="lazy" />
                ) : (
                    <div className="no-poster">No Poster</div>
                )}
                <div className="swipe-card-info">
                    <h3>{title}</h3>
                    <p className="rating">⭐ {movie.vote_average?.toFixed(1)}</p>
                </div>
            </Link>

            {/* Keyboard hint */}
            <div className="keyboard-hint">
                <span>← Pass</span>
                <span>Save →</span>
            </div>
        </div>
    );
}

export default React.memo(SwipeCard);
