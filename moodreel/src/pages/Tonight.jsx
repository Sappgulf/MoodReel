import React, { useEffect, useMemo, useState } from 'react';
import { useMovieDiscovery } from '../hooks/useMovieDiscovery';
import { useProviderSettings } from '../hooks/useProviderSettings';
import MovieCard from '../components/MovieCard';
import { fetchTitleProviders, getCachedTitleProviders } from '../services/providerService';
import { rankRecommendations, explainRecommendation } from '../utils/recommendationScoring';

const PICK_LABELS = ['Safe Bet', 'Best Match', 'Wild Card'];

function pickThree(rankedItems) {
  if (!rankedItems.length) return [];
  const last = rankedItems.length - 1;
  const indices = [0, Math.min(1, last), last];
  const seen = new Set();
  const picks = [];
  for (const index of indices) {
    const item = rankedItems[index];
    const key = `${item.media_type || 'movie'}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push(item);
  }
  return picks;
}

export default function Tonight() {
  const [mood, setMood] = useState('');
  const [availableTime, setAvailableTime] = useState(120);
  const [servicesOnly, setServicesOnly] = useState(true);
  const [mode, setMode] = useState('safe');
  const [providerMap, setProviderMap] = useState({});
  const { region, myServices } = useProviderSettings();
  const {
    recommendations,
    search,
    isLoading,
    error,
    selectedGenres,
    setMood: setDiscoveryMood,
    setContentType: setDiscoveryType,
    contentType,
  } = useMovieDiscovery(new Date().getFullYear(), region, myServices);

  useEffect(() => {
    if (!recommendations.length || !myServices.length) return undefined;
    const controller = new AbortController();
    const seed = {};
    recommendations.slice(0, 24).forEach(item => {
      const mediaType = item.media_type || 'movie';
      const cached = getCachedTitleProviders(item.id, mediaType, region);
      if (cached) seed[`${mediaType}:${item.id}`] = cached;
    });
    if (Object.keys(seed).length) {
      setProviderMap(prev => ({ ...prev, ...seed }));
    }

    Promise.all(
      recommendations.slice(0, 24).map(async item => {
        const mediaType = item.media_type || 'movie';
        const key = `${mediaType}:${item.id}`;
        const providers = await fetchTitleProviders(item.id, mediaType, region, controller.signal);
        return [key, providers];
      })
    )
      .then(entries => {
        if (controller.signal.aborted) return;
        setProviderMap(prev => ({ ...prev, ...Object.fromEntries(entries) }));
      })
      .catch(() => {});

    return () => controller.abort();
  }, [recommendations, region, myServices]);

  const providerMatches = useMemo(() => {
    const matches = new Set();
    if (!myServices.length) return matches;
    for (const [key, value] of Object.entries(providerMap)) {
      const ids = [...(value?.flatrate || []), ...(value?.rent || []), ...(value?.buy || [])].map(
        p => p.provider_id
      );
      if (ids.some(id => myServices.includes(id))) matches.add(key);
    }
    return matches;
  }, [providerMap, myServices]);

  const scoringContext = useMemo(
    () => ({
      selectedGenres,
      providerMatches,
    }),
    [selectedGenres, providerMatches]
  );

  const picks = useMemo(() => {
    let pool = recommendations;
    if (servicesOnly && myServices.length > 0 && providerMatches.size > 0) {
      pool = pool.filter(item => providerMatches.has(`${item.media_type || 'movie'}:${item.id}`));
    }
    const ranked = rankRecommendations(pool, scoringContext).map(entry => entry.item);
    if (!ranked.length) return [];
    if (mode === 'adventurous') {
      return pickThree([...ranked].reverse());
    }
    return pickThree(ranked);
  }, [recommendations, servicesOnly, myServices.length, providerMatches, scoringContext, mode]);

  const runTonight = () => {
    setDiscoveryMood(mood);
    setDiscoveryType(contentType);
    search();
  };

  return (
    <section className="tonight-page">
      <h1>Tonight Mode</h1>
      <p className="tonight-lede">
        Three curated picks based on your mood, time, and streaming services.
      </p>
      <div className="glass-panel tonight-controls">
        <input
          aria-label="Mood"
          value={mood}
          onChange={e => setMood(e.target.value)}
          placeholder="Mood or vibe"
        />
        <input
          aria-label="Available time in minutes"
          type="number"
          min="45"
          max="240"
          value={availableTime}
          onChange={e => setAvailableTime(Number(e.target.value))}
        />
        <label>
          <input
            type="checkbox"
            checked={servicesOnly}
            onChange={e => setServicesOnly(e.target.checked)}
          />
          Only on my services
        </label>
        <select
          aria-label="Content type"
          value={contentType}
          onChange={e => setDiscoveryType(e.target.value)}
        >
          <option value="all">Movies &amp; TV</option>
          <option value="movie">Movies</option>
          <option value="tv">TV</option>
        </select>
        <select aria-label="Pick style" value={mode} onChange={e => setMode(e.target.value)}>
          <option value="safe">Safe picks</option>
          <option value="adventurous">Adventurous</option>
        </select>
        <button type="button" onClick={runTonight}>
          Get tonight picks
        </button>
      </div>

      {isLoading && <p>Finding picks for tonight…</p>}
      {error && <p role="alert">{error}</p>}
      {!isLoading && !error && servicesOnly && myServices.length === 0 && (
        <p>Add your streaming services in Discover filters for provider-aware picks.</p>
      )}
      {!isLoading && !error && picks.length === 0 && (
        <p>No picks yet. Try a mood and tap “Get tonight picks”.</p>
      )}

      <div className="movie-grid">
        {picks.map((item, index) => (
          <article key={`${item.media_type || 'movie'}:${item.id}`} className="tonight-pick">
            <h2>{PICK_LABELS[index] || `Pick ${index + 1}`}</h2>
            <p className="tonight-reason">{explainRecommendation(item, scoringContext)}</p>
            <MovieCard movie={item} onToggleWatchlist={() => {}} isInWatchlist={false} />
          </article>
        ))}
      </div>
    </section>
  );
}
