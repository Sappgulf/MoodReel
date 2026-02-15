import React from 'react';
import './ShuffleOverlay.css';

const ShuffleOverlay = ({ isActive, results = [] }) => {
    if (!isActive) return null;

    // Use a subset of trending or recommendations to create the shuffle visual
    const shuffleItems = results.length > 0
        ? [...results, ...results].slice(0, 10)
        : Array(10).fill({ id: 'dummy', title: 'Loading...' });

    return (
        <div className="shuffle-overlay page-enter">
            <div className="shuffle-container">
                <div className="shuffle-reel">
                    {shuffleItems.map((item, idx) => (
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
                            <div className="shuffle-info">
                                <span className="shuffle-title">{item.title || item.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="shuffle-scanner" />
        </div>
    );
};

export default ShuffleOverlay;
