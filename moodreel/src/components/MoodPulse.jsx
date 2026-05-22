import React, { useEffect, useMemo, useState } from 'react';
import { useMoodHistory } from '../hooks/useMoodHistory';
import { useSounds } from '../hooks/useSounds';

const COMMUNITY_MOOD_SNAPSHOT = [
  { name: 'Cozy', share: 22, color: '#f59e0b', trend: 'up', keyword: 'cozy' },
  { name: 'Nostalgic', share: 20, color: '#f97316', trend: 'up', keyword: 'nostalgic' },
  { name: 'Intense', share: 17, color: '#ef4444', trend: 'flat', keyword: 'thriller' },
  { name: 'Electric', share: 15, color: '#06b6d4', trend: 'up', keyword: 'excited' },
  { name: 'Dreamy', share: 14, color: '#a855f7', trend: 'flat', keyword: 'dreamy' },
  { name: 'Melancholy', share: 11, color: '#64748b', trend: 'down', keyword: 'melancholy' },
];

const MOOD_COLORS = {
  cozy: '#f59e0b',
  romantic: '#f472b6',
  thriller: '#ef4444',
  happy: '#ffd700',
  adventure: '#06b6d4',
  nostalgic: '#f97316',
};

function colorForMood(name) {
  const key = name.toLowerCase().split(/\s+/)[0];
  return MOOD_COLORS[key] || '#a855f7';
}

function MoodPulse() {
  const { playSound } = useSounds();
  const { history } = useMoodHistory();
  const [showAll, setShowAll] = useState(false);
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setBarsReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const pulseData = useMemo(() => {
    if (history.length >= 2) {
      const counts = {};
      history.forEach(m => {
        const key = m.trim();
        if (!key) return;
        counts[key] = (counts[key] || 0) + 1;
      });
      const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
      return Object.entries(counts)
        .map(([name, count]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          share: Math.round((count / total) * 100),
          color: colorForMood(name),
          trend: 'up',
          keyword: name.toLowerCase(),
          isPersonal: true,
        }))
        .sort((a, b) => b.share - a.share)
        .slice(0, 6);
    }
    return COMMUNITY_MOOD_SNAPSHOT;
  }, [history]);

  const visiblePulseData = showAll ? pulseData : pulseData.slice(0, 3);
  const hiddenCount = pulseData.length - visiblePulseData.length;
  const isPersonal = pulseData.some(m => m.isPersonal);

  const applyMood = keyword => {
    playSound('pop');
    if (navigator.vibrate) navigator.vibrate(10);
    window.dispatchEvent(
      new CustomEvent('moodreel:apply-mood', { detail: { mood: keyword, search: true } })
    );
  };

  return (
    <section
      className={`mood-pulse-container ${barsReady ? 'is-ready' : ''}`}
      aria-labelledby="mood-pulse-title"
    >
      <div className="pulse-header">
        <div>
          <p className="pulse-eyebrow">{isPersonal ? 'Your vibe trail' : 'Live signal'}</p>
          <h3 id="mood-pulse-title">{isPersonal ? 'Your Mood Pulse' : 'Global Mood Pulse'}</h3>
        </div>
        <span
          className={`pulse-live ${isPersonal ? 'pulse-live--your' : ''}`}
          aria-label="Snapshot status"
        >
          {isPersonal ? 'From your searches' : 'Updated daily'}
        </span>
      </div>

      <div className="pulse-track" role="list" aria-label="Top moods and share">
        {visiblePulseData.map(mood => (
          <button
            key={mood.name}
            type="button"
            className="pulse-item pulse-item--action"
            style={{ '--mood-color': mood.color, '--pulse-width': `${mood.share}%` }}
            role="listitem"
            onClick={() => applyMood(mood.keyword || mood.name.toLowerCase())}
            aria-label={`Try mood ${mood.name}, ${mood.share} percent`}
          >
            <div className="pulse-label">
              <span className="mood-name">{mood.name}</span>
              <span className="mood-percentage">{mood.share}%</span>
            </div>
            <div className="pulse-bar-wrapper" aria-hidden="true">
              <div className="pulse-bar" />
            </div>
            <span className={`pulse-trend pulse-trend-${mood.trend}`}>
              {mood.trend === 'up'
                ? '↑ rising'
                : mood.trend === 'down'
                  ? '↓ softening'
                  : '→ stable'}
            </span>
          </button>
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

      <p className="pulse-info">
        {isPersonal
          ? 'Tap a mood to search Discover instantly.'
          : 'Tap a trending mood to try it in Discover.'}
      </p>
    </section>
  );
}

export default MoodPulse;
