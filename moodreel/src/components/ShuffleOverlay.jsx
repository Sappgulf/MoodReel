import React, { useEffect } from 'react';
import './ShuffleOverlay.css';

const ShuffleOverlay = ({ isActive, results = [], isWinner = false, winnerItem = null, onDismiss }) => {
    const isVisible = isActive || isWinner;

    useEffect(() => {
        if (!isVisible || !onDismiss) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onDismiss();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, onDismiss]);

    if (!isVisible) return null;

    // Use a subset of trending or recommendations to create the shuffle visual
    const shuffleItems = results.length > 0
        ? [...results, ...results].slice(0, 10)
        : Array(10).fill({ id: 'dummy', title: 'Loading...' });

    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget) {
            onDismiss?.();
        }
    };

    return (
        <div
            className={`shuffle-overlay page-enter ${isWinner ? 'winner' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={isWinner ? 'Shuffle winner reveal' : 'Shuffle in progress'}
            onClick={handleBackdropClick}
        >
            {isWinner && <div className="cinema-scanlines" />}
            <button
                type="button"
                className="shuffle-dismiss-btn"
                onClick={onDismiss}
                aria-label={isWinner ? 'Dismiss winner reveal' : 'Cancel shuffle'}
            >
                ✕
            </button>
            <div className="shuffle-container">
                {isWinner && <div className="winner-pulse" />}
                {isWinner && <div className="winner-shine" />}
                <div className="shuffle-reel" style={isWinner ? { transform: 'translateY(0)' } : {}}>
                    {isWinner && winnerItem ? (
                        <div className="shuffle-item winner-floating">
                            <img
                                src={`https://image.tmdb.org/t/p/w500${winnerItem.poster_path}`}
                                alt={winnerItem.title || winnerItem.name}
                                className="shuffle-poster"
                                loading="lazy"
                                decoding="async"
                            />
                            <div className="shuffle-info">
                                <span className="shuffle-title">{winnerItem.title || winnerItem.name}</span>
                            </div>
                        </div>
                    ) : (
                        shuffleItems.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="shuffle-item">
                                {item.poster_path ? (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                                        alt=""
                                        className="shuffle-poster"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <div className="shuffle-poster-placeholder" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
            {!isWinner && <div className="shuffle-scanner" />}
            <div className="shuffle-overlay-footer">
                <span className="shuffle-overlay-hint">
                    {isWinner ? 'Press Escape or dismiss to return to the feed.' : 'Press Escape to stop the shuffle.'}
                </span>
            </div>
        </div>
    );
};

export default ShuffleOverlay;
