import React, { useCallback } from 'react';

// Emoji to genre mapping
const emojiMoods = [
    { emoji: '😊', label: 'Happy', genres: [35], keyword: 'happy' },
    { emoji: '😢', label: 'Sad', genres: [18], keyword: 'sad' },
    { emoji: '😱', label: 'Scary', genres: [27], keyword: 'horror' },
    { emoji: '💕', label: 'Romance', genres: [10749], keyword: 'romantic' },
    { emoji: '🚀', label: 'Sci-Fi', genres: [878], keyword: 'sci-fi' },
    { emoji: '⚔️', label: 'Action', genres: [28], keyword: 'action' },
    { emoji: '🧙', label: 'Fantasy', genres: [14], keyword: 'fantasy' },
    { emoji: '🔍', label: 'Mystery', genres: [9648], keyword: 'mystery' },
    { emoji: '😂', label: 'Comedy', genres: [35], keyword: 'funny' },
    { emoji: '👨‍👩‍👧', label: 'Family', genres: [10751], keyword: 'family' },
    { emoji: '🎭', label: 'Drama', genres: [18], keyword: 'dramatic' },
    { emoji: '📚', label: 'Documentary', genres: [99], keyword: 'documentary' },
];

function EmojiPicker({ onSelect, selectedGenres = [] }) {
    const handleClick = useCallback((mood) => {
        onSelect(mood);
    }, [onSelect]);

    return (
        <div className="emoji-picker" role="group" aria-label="Quick mood selection">
            <h4>Quick pick:</h4>
            <div className="emoji-grid">
                {emojiMoods.map((mood) => {
                    const isActive = mood.genres.some(g => selectedGenres.includes(g));
                    return (
                        <button
                            key={mood.emoji}
                            className={`emoji-btn ${isActive ? 'active' : ''}`}
                            onClick={() => handleClick(mood)}
                            title={mood.label}
                            aria-label={mood.label}
                            aria-pressed={isActive}
                        >
                            <span className="emoji" aria-hidden="true">{mood.emoji}</span>
                            <span className="emoji-label">{mood.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default React.memo(EmojiPicker);
