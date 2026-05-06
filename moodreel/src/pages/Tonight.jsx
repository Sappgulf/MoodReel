import React, { useEffect, useMemo, useState } from 'react';
import { useMovieDiscovery } from '../hooks/useMovieDiscovery';
import { useProviderSettings } from '../hooks/useProviderSettings';
import { fetchTitleProviders, getCachedTitleProviders } from '../services/providerService';
  const [providerMap, setProviderMap] = useState({});
  const { region, myServices } = useProviderSettings();
  const {
    recommendations,
    search,
    isLoading,
    error,
    setMood: setDiscoveryMood,
    setContentType: setDiscoveryType,
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
        <input
          aria-label="Mood"
          value={mood}
          onChange={e => setMood(e.target.value)}
          placeholder="Mood or vibe"
        />
        <input
          aria-label="Available time"
          type="number"
          min="45"
          max="240"
          value={availableTime}
          onChange={e => setAvailableTime(Number(e.target.value))}
        />
          <input
            type="checkbox"
            checked={servicesOnly}
            onChange={e => setServicesOnly(e.target.checked)}
          />
        <select
          aria-label="Content type"
          value={contentType}
          onChange={e => setContentType(e.target.value)}
        >
      {!isLoading && !error && servicesOnly && myServices.length === 0 && (
        <p>Add your streaming services in Discover filters for better provider-aware picks.</p>
      )}
      {!isLoading && !error && picks.length === 0 && (
        <p>No picks yet. Try a mood and tap “Get tonight picks”.</p>
      )}

        {picks.map((item, index) => {
          const key = `${item.media_type || 'movie'}:${item.id}`;
          return (
            <article key={key} className="movie-card">
              <img
                src={getPosterUrl(item.poster_path)}
                alt={`${getDisplayTitle(item)} poster`}
                loading="lazy"
              />
              <h3>{PICK_LABELS[index]}</h3>
              <p>
                {getDisplayTitle(item)} ({getReleaseYear(item) || 'n/a'})
              </p>
              <p>{explainRecommendation(item, { providerMatches })}</p>
            </article>
          );
        })}
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
