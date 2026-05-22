import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MovieCard from '../components/MovieCard';
import { SkeletonGrid } from '../components/Skeleton';
import { useMovieDiscovery } from '../hooks/useMovieDiscovery';
import { useProviderSettings } from '../hooks/useProviderSettings';
import { useWatchlist } from '../hooks/useWatchlist';
import { useSounds } from '../hooks/useSounds';
import { fetchTitleProviders, getCachedTitleProviders } from '../services/providerService';
import { itemMatchesSelectedProviders } from '../utils/providerFilter';
import { explainRecommendation, rankRecommendations } from '../utils/recommendationScoring';

const PICK_LABELS = ['Safe Bet', 'Best Match', 'Wild Card'];

function pickTonightSlots(ranked, mode) {
  if (ranked.length === 0) return [];
  const used = new Set();
  const takeUnique = predicate => {
    const found = ranked.find(entry => !used.has(entry.item.id) && predicate(entry));
    if (!found) return null;
    used.add(found.item.id);
    return found.item;
  };

  const safe = takeUnique(
    entry => entry.item.vote_average >= 7 && entry.score >= ranked[0].score * 0.85
  );
  const best = takeUnique(() => true);
  const wild = takeUnique(entry =>
    mode === 'adventurous'
      ? entry.item.popularity < ranked[0].item.popularity
      : entry.score <= ranked[Math.min(2, ranked.length - 1)].score
  );

  return [safe, best, wild].filter(Boolean);
}

export default function Tonight() {
  const { playSound } = useSounds();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const [mood, setMood] = useState('cozy');
  const [availableTime, setAvailableTime] = useState(120);
  const [servicesOnly, setServicesOnly] = useState(true);
  const [contentType, setContentType] = useState('all');
  const [mode, setMode] = useState('safe');
  const [picks, setPicks] = useState([]);
  const [providerMap, setProviderMap] = useState({});

  const { region, myServices } = useProviderSettings();
  const {
    recommendations,
    search,
    isLoading,
    error,
    setMood: setDiscoveryMood,
    setContentType: setDiscoveryType,
    setSelectedProviders,
  } = useMovieDiscovery(new Date().getFullYear(), region, myServices);

  useEffect(() => {
    if (!recommendations.length || !myServices.length) return;
    const controller = new AbortController();
    const seed = {};
    recommendations.slice(0, 24).forEach(item => {
      const mediaType = item.media_type || 'movie';
      const cached = getCachedTitleProviders(item.id, mediaType, region);
      if (cached) seed[`${mediaType}:${item.id}`] = cached;
    });
    if (Object.keys(seed).length) setProviderMap(prev => ({ ...prev, ...seed }));

    Promise.all(
      recommendations.slice(0, 24).map(async item => {
        const mediaType = item.media_type || 'movie';
        const key = `${mediaType}:${item.id}`;
        if (seed[key]) return [key, seed[key]];
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
      if (itemMatchesSelectedProviders(value, myServices)) matches.add(key);
    }
    return matches;
  }, [providerMap, myServices]);

  const runTonight = useCallback(() => {
    playSound('click');
    if (navigator.vibrate) navigator.vibrate(15);
    setDiscoveryMood(mood.trim());
    setDiscoveryType(contentType);
    setSelectedProviders(servicesOnly ? myServices : []);
    setPicks([]);
    search();
  }, [
    mood,
    contentType,
    servicesOnly,
    myServices,
    search,
    setDiscoveryMood,
    setDiscoveryType,
    setSelectedProviders,
    playSound,
  ]);

  useEffect(() => {
    if (isLoading || error || recommendations.length === 0) return;

    let pool = recommendations;
    if (servicesOnly && myServices.length > 0) {
      pool = pool.filter(item => {
        const key = `${item.media_type || 'movie'}:${item.id}`;
        const cached = providerMap[key];
        if (!cached) return true;
        return itemMatchesSelectedProviders(cached, myServices);
      });
    }

    const ranked = rankRecommendations(pool, { providerMatches });
    const next = pickTonightSlots(ranked, mode);
    setPicks(next);
    if (next.length > 0 && navigator.vibrate) navigator.vibrate([40, 30, 40]);
  }, [
    recommendations,
    isLoading,
    error,
    servicesOnly,
    myServices,
    providerMap,
    providerMatches,
    mode,
    availableTime,
  ]);

  return (
    <section className="page-enter tonight-page" aria-labelledby="tonight-heading">
      <header className="tonight-header">
        <h1 id="tonight-heading">Tonight Mode</h1>
        <p className="tonight-subtitle">
          Three curated picks based on your mood, time, and streaming services.
        </p>
      </header>

      <div className="glass-panel tonight-controls">
        <div className="tonight-mood-presets" role="group" aria-label="Quick mood presets">
          {['cozy', 'excited', 'romantic', 'scary', 'nostalgic', 'curious'].map(preset => (
            <button
              key={preset}
              type="button"
              className={`tonight-preset-chip ${mood === preset ? 'active' : ''}`}
              onClick={() => {
                setMood(preset);
                playSound('pop');
              }}
            >
              {preset}
            </button>
          ))}
        </div>
        <label className="tonight-field">
          <span>Mood</span>
          <input
            aria-label="Mood"
            value={mood}
            onChange={e => setMood(e.target.value)}
            placeholder="Cozy, thrilling, nostalgic…"
          />
        </label>

        <label className="tonight-field">
          <span>Available time (minutes)</span>
          <input
            aria-label="Available time in minutes"
            type="number"
            min="45"
            max="240"
            value={availableTime}
            onChange={e => setAvailableTime(Number(e.target.value))}
          />
        </label>

        <label className="tonight-checkbox">
          <input
            type="checkbox"
            checked={servicesOnly}
            onChange={e => setServicesOnly(e.target.checked)}
          />
          Only show titles on my services
        </label>

        <label className="tonight-field">
          <span>Content type</span>
          <select
            aria-label="Content type"
            value={contentType}
            onChange={e => setContentType(e.target.value)}
          >
            <option value="all">Movies &amp; TV</option>
            <option value="movie">Movies</option>
            <option value="tv">TV</option>
          </select>
        </label>

        <label className="tonight-field">
          <span>Tonight vibe</span>
          <select aria-label="Tonight vibe" value={mode} onChange={e => setMode(e.target.value)}>
            <option value="safe">Safe picks</option>
            <option value="adventurous">Adventurous</option>
          </select>
        </label>

        <button type="button" className="primary-button" onClick={runTonight} disabled={isLoading}>
          Get tonight picks
        </button>
      </div>

      {isLoading && (
        <>
          <p className="tonight-status">Finding picks for tonight…</p>
          <SkeletonGrid count={3} />
        </>
      )}
      {error && (
        <p className="tonight-status tonight-status--error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && servicesOnly && myServices.length === 0 && (
        <p className="tonight-hint">
          Add your streaming services in Discover filters for provider-aware picks.
        </p>
      )}

      {!isLoading && !error && picks.length === 0 && (
        <p className="tonight-hint">Set your mood and tap &ldquo;Get tonight picks&rdquo;.</p>
      )}

      <div className="movie-grid tonight-grid">
        {picks.map((item, index) => {
          const key = `${item.media_type || 'movie'}:${item.id}`;
          return (
            <article key={key} className="tonight-pick">
              <p className="tonight-pick-label">{PICK_LABELS[index]}</p>
              <p className="tonight-pick-reason">
                {explainRecommendation(item, { providerMatches })}
              </p>
              <MovieCard
                movie={item}
                index={index}
                onToggleWatchlist={toggleWatchlist}
                isInWatchlist={isInWatchlist(item.id)}
                mediaType={item.media_type}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
