import React, { useMemo, useState } from 'react';
import { useMovieDiscovery } from '../hooks/useMovieDiscovery';
import MovieCard from '../components/MovieCard';
import { rankRecommendations, explainRecommendation } from '../utils/recommendationScoring';

export default function Tonight() {
  const [mood, setMood] = useState('');
  const [time, setTime] = useState(120);
  const [servicesOnly, setServicesOnly] = useState(true);
  const [mode, setMode] = useState('safe');
  const { recommendations, search, isLoading, error, setMood: setDiscoveryMood } = useMovieDiscovery(new Date().getFullYear(), 'US');

  const picks = useMemo(() => {
    const ranked = rankRecommendations(recommendations, {}).map(x => x.item);
    if (!ranked.length) return [];
    return [ranked[0], ranked[Math.min(1, ranked.length - 1)], ranked[Math.max(ranked.length - 1, 0)]];
  }, [recommendations]);

  const runTonight = () => {
    setDiscoveryMood(mood);
    search();
  };

  return (
    <section>
      <h1>Tonight Mode</h1>
      <div className="glass-panel">
        <input aria-label="Mood" value={mood} onChange={e => setMood(e.target.value)} placeholder="How are you feeling?" />
        <input aria-label="Available time" type="number" value={time} onChange={e => setTime(Number(e.target.value))} />
        <label><input type="checkbox" checked={servicesOnly} onChange={e => setServicesOnly(e.target.checked)} /> Services only</label>
        <select value={mode} onChange={e => setMode(e.target.value)}><option value="safe">Safe pick</option><option value="adventurous">Adventurous</option></select>
        <button onClick={runTonight}>Get 3 picks</button>
      </div>
      {isLoading && <p>Finding picks for tonight…</p>}
      {error && <p role="alert">{error}</p>}
      {!isLoading && !error && picks.length === 0 && <p>Set your mood and run Tonight Mode.</p>}
      <div className="movie-grid">
        {picks.map((item, index) => (
          <article key={`${item.media_type}:${item.id}`}>
            <h3>{['Safe Bet', 'Best Match', 'Wild Card'][index]}</h3>
            <p>{explainRecommendation(item, {})}</p>
            <MovieCard movie={item} onToggleWatchlist={() => {}} isInWatchlist={false} onViewDetails={() => {}} />
          </article>
        ))}
      </div>
    </section>
  );
}
