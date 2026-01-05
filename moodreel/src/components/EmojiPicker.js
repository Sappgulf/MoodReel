import React, { useCallback, useState, useRef } from 'react';

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

// Particle component for burst animation
function Particle({ style }) {
    return <span className="emoji-particle" style={style} />;
}

function EmojiPicker({ onSelect, selectedGenres = [], allowMultiple = true }) {
    const [particles, setParticles] = useState([]);
    const particleIdRef = useRef(0);

    const createParticleBurst = useCallback((e, color) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const newParticles = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const velocity = 40 + Math.random() * 30;
            const id = particleIdRef.current++;

            newParticles.push({
                id,
                x: centerX + Math.cos(angle) * velocity,
                y: centerY + Math.sin(angle) * velocity,
                color
            });
        }

        setParticles(prev => [...prev, ...newParticles]);

        // Clean up particles after animation
        setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
        }, 600);
    }, []);

    const handleClick = useCallback((mood, e) => {
        // Create particle burst
        const colors = {
            happy: '#FFD700', sad: '#6B8DD6', horror: '#DC143C',
            romantic: '#FF69B4', 'sci-fi': '#00CED1', action: '#FF6B6B',
            fantasy: '#9C27B0', mystery: '#607D8B', funny: '#FFD700',
            family: '#4CAF50', dramatic: '#6B8DD6', documentary: '#4CAF50'
        };
        createParticleBurst(e, colors[mood.keyword] || '#FFD700');

        onSelect(mood);
    }, [onSelect, createParticleBurst]);

    return (
        <div className="emoji-picker" role="group" aria-label="Quick mood selection">
            <h4>Quick pick: {allowMultiple && <span className="multi-hint">(select multiple)</span>}</h4>
            <div className="emoji-grid">
                {emojiMoods.map((mood) => {
                    const isActive = mood.genres.some(g => selectedGenres.includes(g));
                    return (
                        <button
                            key={mood.emoji}
                            className={`emoji-btn ${isActive ? 'active' : ''}`}
                            onClick={(e) => handleClick(mood, e)}
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

            {/* Particle container */}
            <div className="particle-container">
                {particles.map((particle) => (
                    <Particle
                        key={particle.id}
                        style={{
                            left: particle.x,
                            top: particle.y,
                            background: particle.color
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

export default React.memo(EmojiPicker);
