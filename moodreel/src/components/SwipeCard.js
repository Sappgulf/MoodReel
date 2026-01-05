import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';

const SWIPE_THRESHOLD = 100;

function SwipeCard({ movie, onSwipeLeft, onSwipeRight, mediaType }) {
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isExiting, setIsExiting] = useState(null);
    const startX = useRef(0);

    // Reset animation state when movie changes (new card appears)
    useEffect(() => {
        setOffset(0);
        setIsDragging(false);
        setIsExiting(null);
    }, [movie?.id]);

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
            // Swipe right - add to watchlist
            setIsExiting('right');
            setTimeout(() => onSwipeRight?.(movie), 300);
        } else if (offset < -SWIPE_THRESHOLD) {
            // Swipe left - dismiss
            setIsExiting('left');
            setTimeout(() => onSwipeLeft?.(movie), 300);
        } else {
            setOffset(0);
        }
    }, [offset, movie, onSwipeLeft, onSwipeRight]);

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
            className="swipe-card"
            style={style}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
        </div>
    );
}

export default React.memo(SwipeCard);
