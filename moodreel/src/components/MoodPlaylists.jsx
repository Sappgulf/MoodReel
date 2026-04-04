import React, { useState, useCallback } from 'react';
import { useCustomPlaylists } from '../hooks/useCustomPlaylists';

/**
 * Pre-defined mood playlists with curated genre/keyword combinations
 */
const PLAYLISTS = [
    {
        id: 'cozy-sunday',
        name: '☕ Cozy Sunday',
        description: 'Warm, feel-good movies for a relaxing day',
        color: '#F5A623',
        genres: [35, 10751, 10749], // Comedy, Family, Romance
        keywords: 'heartwarming,comfort,cozy'
    },
    {
        id: 'date-night',
        name: '💕 Date Night',
        description: 'Romantic and fun picks for two',
        color: '#E91E63',
        genres: [10749, 35], // Romance, Comedy
        keywords: 'romantic,love,date'
    },
    {
        id: 'mind-benders',
        name: '🧠 Mind-Benders',
        description: 'Twist-filled thrillers that keep you guessing',
        color: '#9C27B0',
        genres: [53, 9648, 878], // Thriller, Mystery, Sci-Fi
        keywords: 'twist,mind-bending,thriller'
    },
    {
        id: 'adrenaline-rush',
        name: '💥 Adrenaline Rush',
        description: 'High-octane action and adventure',
        color: '#F44336',
        genres: [28, 12], // Action, Adventure
        keywords: 'action,adventure,intense'
    },
    {
        id: 'laughs-only',
        name: '😂 Laughs Only',
        description: 'Pure comedy to lift your spirits',
        color: '#4CAF50',
        genres: [35], // Comedy
        keywords: 'funny,hilarious,comedy'
    },
    {
        id: 'spine-tinglers',
        name: '👻 Spine Tinglers',
        description: 'Scary movies for brave souls',
        color: '#37474F',
        genres: [27], // Horror
        keywords: 'scary,horror,creepy'
    },
    {
        id: 'tearjerkers',
        name: '😢 Tearjerkers',
        description: 'Emotional dramas that hit the feels',
        color: '#2196F3',
        genres: [18], // Drama
        keywords: 'emotional,sad,dramatic'
    },
    {
        id: 'family-fun',
        name: '👨‍👩‍👧‍👦 Family Fun',
        description: 'Movies everyone can enjoy together',
        color: '#FF9800',
        genres: [10751, 16], // Family, Animation
        keywords: 'family,kids,animated'
    }
];

/**
 * MoodPlaylists - Curated and custom movie collections
 */
function MoodPlaylists({ onSelectPlaylist }) {
    const { playlists, deletePlaylist } = useCustomPlaylists();
    const [hoveredId, setHoveredId] = useState(null);

    const handleSelect = useCallback((playlist, isCustom = false) => {
        if (isCustom) {
            onSelectPlaylist({
                name: playlist.name,
                customFilters: playlist.filters
            });
        } else {
            onSelectPlaylist({
                genres: playlist.genres,
                keywords: playlist.keywords,
                name: playlist.name
            });
        }
    }, [onSelectPlaylist]);

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm("Delete this custom vibe?")) {
            deletePlaylist(id);
        }
    };

    return (
        <div className="mood-playlists-section">
            <h3 className="playlists-title">🎬 Mood Playlists</h3>
            <p className="playlists-subtitle">Curated collections for every vibe</p>

            <div className="playlists-grid">
                {/* Curated Playlists */}
                {PLAYLISTS.map(playlist => (
                    <button
                        key={playlist.id}
                        className={`playlist-card ${hoveredId === playlist.id ? 'hovered' : ''}`}
                        onClick={() => handleSelect(playlist)}
                        onMouseEnter={() => setHoveredId(playlist.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                            '--playlist-color': playlist.color
                        }}
                    >
                        <span className="playlist-name">{playlist.name}</span>
                        <span className="playlist-desc">{playlist.description}</span>
                    </button>
                ))}

                {/* Custom Playlists */}
                {playlists.map(playlist => (
                    <button
                        key={playlist.id}
                        className="playlist-card custom-playlist"
                        onClick={() => handleSelect(playlist, true)}
                        onMouseEnter={() => setHoveredId(playlist.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                            '--playlist-color': playlist.color
                        }}
                    >
                        <span className="playlist-name">✨ {playlist.name}</span>
                        <span className="playlist-desc">{playlist.desc}</span>
                        <span
                            className="delete-playlist"
                            onClick={(e) => handleDelete(e, playlist.id)}
                            title="Delete vibe"
                        >
                            ✕
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default React.memo(MoodPlaylists);
