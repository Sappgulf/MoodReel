import React, { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';

/**
 * Premium movie card component with poster, info, and watchlist button
 * Memoized to prevent unnecessary re-renders
 */
const MovieCard = memo(function MovieCard({ movie, isInWatchlist, onToggleWatchlist, mediaType = 'movie' }) {
    const title = movie.title || movie.name;
    const date = movie.release_date || movie.first_air_date;
    const year = date ? new Date(date).getFullYear() : '';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
    const detailPath = mediaType === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`;

    const handleWatchlistClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleWatchlist(movie);
    }, [movie, onToggleWatchlist]);

    return (
        <div className="recommendation fade-in">
            <button
                className={`watchlist-btn ${isInWatchlist ? 'active' : ''}`}
                onClick={handleWatchlistClick}
                aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                aria-pressed={isInWatchlist}
            >
                {isInWatchlist ? '❤️' : '🤍'}
            </button>

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
