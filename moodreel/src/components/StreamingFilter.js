import React, { useCallback, useState } from 'react';
import { getPosterUrl } from '../utils/mediaUtils';

// Curated list of top streaming providers (TMDB US IDs)
export const STREAMING_PROVIDERS = [
    { id: 8, name: 'Netflix', logo: '🔴' },
    { id: 9, name: 'Prime Video', logo: '📦' },
    { id: 337, name: 'Disney+', logo: '🏰' },
    { id: 384, name: 'HBO Max', logo: '🎬' },
    { id: 15, name: 'Hulu', logo: '💚' },
    { id: 350, name: 'Apple TV+', logo: '🍎' },
    { id: 386, name: 'Peacock', logo: '🦚' },
    { id: 531, name: 'Paramount+', logo: '⭐' },
    { id: 1899, name: 'Max', logo: '🎭' },
    { id: 283, name: 'Crunchyroll', logo: '🍥' },
    { id: 43, name: 'Starz', logo: '⭐' },
    { id: 37, name: 'Showtime', logo: '🎥' },
    { id: 387, name: 'Peacock Premium', logo: '🦚' },
    { id: 2, name: 'Apple iTunes', logo: '🍏' },
    { id: 3, name: 'Google Play', logo: '▶️' },
];

// Max providers to show initially
const INITIAL_SHOW_COUNT = 8;

function StreamingFilter({ selectedProviders = [], onToggle, providers, label = 'My Services:' }) {
    const [showAll, setShowAll] = useState(false);

    // Use curated list if providers not provided or too many
    const displayProviders = (!providers || providers.length > 50)
        ? STREAMING_PROVIDERS
        : providers.length > 0 ? providers : STREAMING_PROVIDERS;

    const visibleProviders = showAll ? displayProviders : displayProviders.slice(0, INITIAL_SHOW_COUNT);
    const hasMore = displayProviders.length > INITIAL_SHOW_COUNT;

    const handleToggle = useCallback((providerId) => {
        onToggle(providerId);
    }, [onToggle]);

    return (
        <div className="streaming-filter" role="group" aria-label="Streaming service filter">
            <h4>{label}</h4>
            <div className="streaming-buttons">
                {visibleProviders.map((provider) => {
                    const isSelected = selectedProviders.includes(provider.id);
                    return (
                        <button
                            key={provider.id}
                            className={`streaming-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => handleToggle(provider.id)}
                            aria-pressed={isSelected}
                            title={provider.name}
                        >
                            {provider.logoPath ? (
                                <img
                                    className="streaming-logo-img"
                                    src={getPosterUrl(provider.logoPath, 'w45')}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <span className="streaming-logo" aria-hidden="true">{provider.logo}</span>
                            )}
                            <span className="streaming-name">{provider.name}</span>
                        </button>
                    );
                })}
            </div>
            {hasMore && (
                <button
                    className="show-more-btn"
                    onClick={() => setShowAll(!showAll)}
                    type="button"
                >
                    {showAll ? '▲ Show less' : `▼ Show ${displayProviders.length - INITIAL_SHOW_COUNT} more`}
                </button>
            )}
        </div>
    );
}

export default React.memo(StreamingFilter);

