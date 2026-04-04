import React, { useCallback, useState } from 'react';

function StarRating({ rating = 0, onRate, readonly = false, size = 'medium' }) {
    const [hoverRating, setHoverRating] = useState(0);

    const handleClick = useCallback((star) => {
        if (!readonly && onRate) {
            onRate(star);
        }
    }, [readonly, onRate]);

    const handleMouseEnter = useCallback((star) => {
        if (!readonly) {
            setHoverRating(star);
        }
    }, [readonly]);

    const handleMouseLeave = useCallback(() => {
        setHoverRating(0);
    }, []);

    const displayRating = hoverRating || rating;

    return (
        <div
            className={`star-rating star-rating-${size} ${readonly ? 'readonly' : 'interactive'}`}
            role="group"
            aria-label={readonly ? `Rating: ${rating} out of 5 stars` : 'Rate this movie'}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`star ${star <= displayRating ? 'filled' : 'empty'}`}
                    onClick={() => handleClick(star)}
                    onMouseEnter={() => handleMouseEnter(star)}
                    onMouseLeave={handleMouseLeave}
                    disabled={readonly}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                    {star <= displayRating ? '★' : '☆'}
                </button>
            ))}
        </div>
    );
}

export default React.memo(StarRating);
