import React, { useMemo, useState } from 'react';

const COMMUNITY_MOOD_SNAPSHOT = [
  { name: 'Cozy', share: 22, color: '#f59e0b', trend: 'up' },
  { name: 'Nostalgic', share: 20, color: '#f97316', trend: 'up' },
  { name: 'Intense', share: 17, color: '#ef4444', trend: 'flat' },
  { name: 'Electric', share: 15, color: '#06b6d4', trend: 'up' },
  { name: 'Dreamy', share: 14, color: '#a855f7', trend: 'flat' },
  { name: 'Melancholy', share: 11, color: '#64748b', trend: 'down' },
];

function MoodPulse() {
  const [showAll, setShowAll] = useState(false);
  const pulseData = useMemo(
    () => [...COMMUNITY_MOOD_SNAPSHOT].sort((a, b) => b.share - a.share),
    []
  );
  const visiblePulseData = showAll ? pulseData : pulseData.slice(0, 3);
  const hiddenCount = pulseData.length - visiblePulseData.length;

  return (
    <section className="mood-pulse-container" aria-labelledby="mood-pulse-title">
      <div className="pulse-header">
        <div>
          <p className="pulse-eyebrow">Live signal</p>
          <h3 id="mood-pulse-title">Global Mood Pulse</h3>
        </div>
        <span className="pulse-live" aria-label="Snapshot status">
          Updated daily
        </span>
      </div>

      <div className="pulse-track" role="list" aria-label="Top moods and share">
        {visiblePulseData.map(mood => (
          <article
            key={mood.name}
            className="pulse-item"
            style={{ '--mood-color': mood.color }}
            role="listitem"
          >
            <div className="pulse-label">
              <span className="mood-name">{mood.name}</span>
              <span className="mood-percentage">{mood.share}%</span>
            </div>
            <div className="pulse-bar-wrapper" aria-hidden="true">
              <div className="pulse-bar" style={{ width: `${mood.share}%` }} />
            </div>
            <span className={`pulse-trend pulse-trend-${mood.trend}`}>
              {mood.trend === 'up'
                ? '↑ rising'
                : mood.trend === 'down'
                  ? '↓ softening'
                  : '→ stable'}
            </span>
          </article>
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          className="show-more-btn"
          onClick={() => setShowAll(prev => !prev)}
          aria-expanded={showAll}
        >
          {showAll ? '▲ Show fewer moods' : `▼ Show ${hiddenCount} more moods`}
        </button>
      )}

      <p className="pulse-info">Recent mood searches, anonymized. Use it as a hint, not a rule.</p>
    </section>
  );
}

export default MoodPulse;
