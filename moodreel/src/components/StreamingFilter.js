import React, { useCallback } from 'react';
import { getPosterUrl } from '../utils/mediaUtils';

// TMDB streaming provider IDs (US region)
export const STREAMING_PROVIDERS = [
    { id: 8, name: 'Netflix', logo: '🔴' },
    { id: 9, name: 'Prime Video', logo: '📦' },
    { id: 337, name: 'Disney+', logo: '🏰' },
    { id: 384, name: 'HBO Max', logo: '🎬' },
    { id: 15, name: 'Hulu', logo: '💚' },
    { id: 350, name: 'Apple TV+', logo: '🍎' },
    { id: 386, name: 'Peacock', logo: '🦚' },
    { id: 531, name: 'Paramount+', logo: '⭐' },
];

function StreamingFilter({ selectedProviders = [], onToggle, providers = STREAMING_PROVIDERS, label = 'Filter by streaming:' }) {
    const handleToggle = useCallback((providerId) => {
        onToggle(providerId);
    }, [onToggle]);

    return (
        <div className="streaming-filter" role="group" aria-label="Streaming service filter">
            <h4>{label}</h4>
            <div className="streaming-buttons">
                {providers.map((provider) => {
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
        </div>
    );
}

export default React.memo(StreamingFilter);
