import React, { useCallback } from 'react';

/**
 * Rating filter slider component
 * Filters movies by minimum TMDB score
 */
function RatingFilter({ minRating, onRatingChange }) {
    const handleChange = useCallback((e) => {
        onRatingChange(parseFloat(e.target.value));
    }, [onRatingChange]);

    return (
        <div className="rating-filter" role="group" aria-label="Minimum rating filter">
            <h4>Minimum Rating:</h4>
            <div className="rating-slider-wrapper">
                <input
                    type="range"
                    min="0"
                    max="9"
                    step="0.5"
                    value={minRating}
                    onChange={handleChange}
                    className="rating-slider"
                    aria-label="Minimum rating"
                />
                <span className="rating-value">
                    {minRating > 0 ? `⭐ ${minRating}+` : 'Any'}
                </span>
            </div>
        </div>
    );
}

export default React.memo(RatingFilter);
