import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Drama,
  Ghost,
  Heart,
  Laugh,
  Rocket,
  Search,
  Smile,
  Sparkles,
  Swords,
  Users,
} from 'lucide-react';

const moodOptions = [
  { icon: Smile, label: 'Happy', genres: [35], keyword: 'happy', color: '#f59e0b' },
  { icon: Drama, label: 'Sad', genres: [18], keyword: 'sad', color: '#60a5fa' },
  { icon: Ghost, label: 'Scary', genres: [27], keyword: 'horror', color: '#ef4444' },
  { icon: Heart, label: 'Romance', genres: [10749], keyword: 'romantic', color: '#f472b6' },
  { icon: Rocket, label: 'Sci-Fi', genres: [878], keyword: 'sci-fi', color: '#06b6d4' },
  { icon: Swords, label: 'Action', genres: [28], keyword: 'action', color: '#fb7185' },
  { icon: Sparkles, label: 'Fantasy', genres: [14], keyword: 'fantasy', color: '#a855f7' },
  { icon: Search, label: 'Mystery', genres: [9648], keyword: 'mystery', color: '#94a3b8' },
  { icon: Laugh, label: 'Comedy', genres: [35], keyword: 'funny', color: '#facc15' },
  { icon: Users, label: 'Family', genres: [10751], keyword: 'family', color: '#4ade80' },
  { icon: Smile, label: 'Drama', genres: [18], keyword: 'dramatic', color: '#93c5fd' },
  { icon: BookOpen, label: 'Documentary', genres: [99], keyword: 'documentary', color: '#34d399' },
];

function Particle({ style }) {
  return <span className="emoji-particle" style={style} />;
}

function EmojiPicker({ onSelect, selectedGenres = [], allowMultiple = true }) {
  const [particles, setParticles] = useState([]);
  const [showAllMoods, setShowAllMoods] = useState(false);
  const particleIdRef = useRef(0);

  const activeCount = useMemo(
    () => moodOptions.filter(mood => mood.genres.some(g => selectedGenres.includes(g))).length,
    [selectedGenres]
  );

  const createParticleBurst = useCallback((e, color) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const newParticles = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const velocity = 34 + Math.random() * 24;
      const id = particleIdRef.current++;

      newParticles.push({
        id,
        x: centerX + Math.cos(angle) * velocity,
        y: centerY + Math.sin(angle) * velocity,
        color,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 500);
  }, []);

  const handleClick = useCallback(
    (mood, e) => {
      createParticleBurst(e, mood.color);
      if (navigator.vibrate) navigator.vibrate(15);
      onSelect(mood);
    },
    [onSelect, createParticleBurst]
  );

  const visibleMoods = showAllMoods ? moodOptions : moodOptions.slice(0, 6);
  const hiddenMoodCount = moodOptions.length - visibleMoods.length;

  return (
    <section className="emoji-picker" role="group" aria-label="Quick mood selection">
      <div className="emoji-picker-header">
        <h4>Quick Mood Picks</h4>
        {allowMultiple ? (
          <p className="emoji-hint">Pick moods · {activeCount} selected</p>
        ) : (
          <p className="emoji-hint">Choose one mood</p>
        )}
      </div>

      <div className="emoji-grid">
        {visibleMoods.map(mood => {
          const isActive = mood.genres.some(g => selectedGenres.includes(g));
          const Icon = mood.icon;

          return (
            <button
              key={mood.label}
              className={`emoji-btn ${isActive ? 'active' : ''}`}
              onClick={e => handleClick(mood, e)}
              title={mood.label}
              aria-label={mood.label}
              aria-pressed={isActive}
            >
              <span className="emoji" aria-hidden="true">
                <Icon size={20} strokeWidth={2} />
              </span>
              <span className="emoji-label">{mood.label}</span>
            </button>
          );
        })}
      </div>

      {hiddenMoodCount > 0 && (
        <button
          type="button"
          className="show-more-btn"
          onClick={() => setShowAllMoods(prev => !prev)}
          aria-expanded={showAllMoods}
        >
          {showAllMoods ? (
            <>
              <ChevronUp size={14} /> Show fewer moods
            </>
          ) : (
            <>
              <ChevronDown size={14} /> Show {hiddenMoodCount} more moods
            </>
          )}
        </button>
      )}

      <div className="particle-container" aria-hidden="true">
        {particles.map(particle => (
          <Particle
            key={particle.id}
            style={{
              left: particle.x,
              top: particle.y,
              background: particle.color,
            }}
          />
        ))}
      </div>
    </section>
  );
}

export default React.memo(EmojiPicker);
