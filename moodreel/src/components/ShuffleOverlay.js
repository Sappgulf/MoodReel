import React from 'react';
import './ShuffleOverlay.css';

const ShuffleOverlay = ({ isActive, results = [], isWinner = false, winnerItem = null }) => {
    if (!isActive && !isWinner) return null;

    // Use a subset of trending or recommendations to create the shuffle visual
    const shuffleItems = results.length > 0
        ? [...results, ...results].slice(0, 10)
        : Array(10).fill({ id: 'dummy', title: 'Loading...' });

    return (
        <div className={`shuffle-overlay page-enter ${isWinner ? 'winner' : ''}`}>
            {isWinner && <div className="cinema-scanlines" />}
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
        </div>
    );
};

export default ShuffleOverlay;
