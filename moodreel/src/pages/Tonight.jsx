import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMovieDiscovery } from '../hooks/useMovieDiscovery';
import { useProviderSettings } from '../hooks/useProviderSettings';
import { useWatchlist } from '../hooks/useWatchlist';
import { useTasteProfile } from '../hooks/useTasteProfile';
import { useTitleProviderMap, useProviderMatches } from '../hooks/useTitleProviderMap';
import MovieCard from '../components/MovieCard';
import ShareMoodCard from '../components/ShareMoodCard';
import { MovieCardSkeleton } from '../components/Skeleton';
import { rankRecommendations, explainRecommendation } from '../utils/recommendationScoring';
import { buildScoringContext, getMediaKey } from '../utils/mediaKeys';
import {
  availabilityLabel,
  getProviderAvailabilityStatus,
  providerBadgesFromData,
} from '../utils/providerAvailability';

const PICK_LABELS = ['Safe Bet', 'Best Match', 'Wild Card'];

function pickThree(rankedItems, mode) {
  if (!rankedItems.length) return [];
  const pool = mode === 'adventurous' ? [...rankedItems].reverse() : rankedItems;
  const last = pool.length - 1;
  const indices = [0, Math.min(1, last), last];
  const seen = new Set();
  const picks = [];
  for (const index of indices) {
    const item = pool[index];
    const key = getMediaKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push(item);
  }
  return picks;
}

export default function Tonight() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mood, setMood] = useState(() => searchParams.get('mood') || '');
  const [availableTime, setAvailableTime] = useState(() => Number(searchParams.get('time')) || 120);
  const [servicesOnly, setServicesOnly] = useState(() => searchParams.get('services') !== '0');
  const [mode, setMode] = useState(() => searchParams.get('mode') || 'safe');

  const { region, myServices } = useProviderSettings();
  const { watchlist, isInWatchlist, toggleWatchlist, watchedKeys, favorites } = useWatchlist();
  const { profile, like, dislike, statusFor, showHidden } = useTasteProfile();

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

  const { providerMap, isLoadingProviders } = useTitleProviderMap(recommendations, region, {
    enabled: recommendations.length > 0 && myServices.length > 0,
  });
  const providerMatches = useProviderMatches(providerMap, myServices);

  const scoringContext = useMemo(
    () =>
      buildScoringContext({
        selectedGenres,
        providerMatches,
        profile,
        watchlist,
        watchedKeys,
        favorites,
        availableMinutes: availableTime,
        showHidden,
      }),
    [selectedGenres, providerMatches, profile, watched, favorites, availableTime, showHidden]
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (mood) params.set('mood', mood);
    if (availableTime !== 120) params.set('time', String(availableTime));
    if (!servicesOnly) params.set('services', '0');
    if (mode !== 'safe') params.set('mode', mode);
    if (contentType !== 'all') params.set('type', contentType);
    setSearchParams(params, { replace: true });
  }, [mood, availableTime, servicesOnly, mode, contentType, setSearchParams]);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && type !== contentType) setDiscoveryType(type);
  }, [searchParams, contentType, setDiscoveryType]);

  const picks = useMemo(() => {
    let pool = recommendations.filter(item => !scoringContext.hiddenKeys?.has(getMediaKey(item)));
    if (servicesOnly && myServices.length > 0) {
      const checked = pool.filter(
        item => getProviderAvailabilityStatus(item, providerMap, myServices) === 'confirmed'
      );
      if (checked.length > 0 || !isLoadingProviders) {
        pool = checked.length ? checked : pool;
      }
    }
    const ranked = rankRecommendations(pool, scoringContext).map(entry => entry.item);
    return pickThree(ranked, mode);
  }, [
    recommendations,
    servicesOnly,
    myServices,
    providerMap,
    isLoadingProviders,
    scoringContext,
    mode,
  ]);

  const runTonight = () => {
    setDiscoveryMood(mood);
    setDiscoveryType(contentType);
    search();
  };

  const showProviderHold =
    servicesOnly && myServices.length > 0 && isLoadingProviders && recommendations.length > 0;

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

      {isLoading && <p className="tonight-status">Finding picks for tonight…</p>}
      {showProviderHold && (
        <p className="tonight-status" role="status">
          Checking which titles are on your services…
        </p>
      )}
      {error && (
        <p className="tonight-error" role="alert">
          {error}
        </p>
      )}
      {!isLoading && !error && servicesOnly && myServices.length === 0 && (
        <p className="tonight-hint">
          Add your streaming services in Discover filters for provider-aware picks.
        </p>
      )}
      {!isLoading && !error && picks.length === 0 && (
        <p className="tonight-hint">No picks yet. Try a mood and tap “Get tonight picks”.</p>
      )}

      {isLoading && (
        <div className="movie-grid">
          {[0, 1, 2].map(i => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      )}

      <div className="movie-grid">
        {picks.map((item, index) => {
          const mediaType = item.media_type || 'movie';
          const availability = getProviderAvailabilityStatus(item, providerMap, myServices);
          const badges = providerBadgesFromData(providerMap[getMediaKey(item)], myServices);
          return (
            <article key={getMediaKey(item)} className="tonight-pick">
              <h2>{PICK_LABELS[index] || `Pick ${index + 1}`}</h2>
              <p className="tonight-reason">{explainRecommendation(item, scoringContext)}</p>
              <p className={`provider-status provider-status--${availability}`}>
                {availabilityLabel(availability)}
              </p>
              <MovieCard
                movie={item}
                mediaType={mediaType}
                onToggleWatchlist={() => toggleWatchlist(item)}
                isInWatchlist={isInWatchlist(item.id, mediaType)}
                onLike={() => like(item, mediaType)}
                onDislike={() => dislike(item, mediaType)}
                tasteStatus={statusFor(item.id, mediaType)}
                providerBadges={badges}
              />
            </article>
          );
        })}
      </div>

      {picks.length > 0 && (
        <ShareMoodCard mood={mood || 'Tonight'} picks={picks} className="tonight-share" />
      )}
    </section>
  );
}
