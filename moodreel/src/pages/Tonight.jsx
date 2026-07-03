import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import ErrorState from '../components/ErrorState';
import MediaImage from '../components/MediaImage';
import ProviderBadges from '../components/ProviderBadges';
import ScoreBreakdown from '../components/ScoreBreakdown';
import { MovieCardSkeleton } from '../components/Skeleton';
import { TOP_STREAMING_SERVICES } from '../constants/streamingServices';
import { RISK_OPTIONS, RUNTIME_OPTIONS, WATCHING_CONTEXTS } from '../constants/tonightOptions';
import { useMoodHistory } from '../hooks/useMoodHistory';
import { useProviderSettings } from '../hooks/useProviderSettings';
import { useTasteProfile } from '../hooks/useTasteProfile';
import { useTonightPreferences } from '../hooks/useTonightPreferences';
import { useWatchlist } from '../hooks/useWatchlist';
import { useToasts } from '../context/ToastContext';
import { useTrailer } from '../context/TrailerContext';
import { fetchTitleProviders } from '../services/providerService';
import searchService from '../services/searchService';
import { shouldSkipLog, getUserFacingMessage } from '../services/apiErrorUtils';
import { safeGetJSON } from '../storage/safeStorage';
import { StorageKeys as SK } from '../storage/storageKeys';
import { copyToClipboard } from '../utils/clipboard';
import { getDisplayOverview, getDisplayTitle, getReleaseYear } from '../utils/mediaUtils';
import {
  buildTonightPicks,
  buildScoreBreakdown,
  getRecommendationKey,
  rankRecommendations,
  TONIGHT_MODES,
  TASTE_SETTING_DEFAULTS,
} from '../utils/recommendationScoring';

const TASTE_SETTINGS_KEY = 'moodreel-taste-settings';

function getTypeLabel(item) {
  return item?.media_type === 'tv' ? 'TV' : 'Movie';
}

function getRuntime(item) {
  const runtime = item?.runtime ?? item?.runtime_minutes ?? item?.episode_run_time?.[0];
  const numericRuntime = Number(runtime);
  return Number.isFinite(numericRuntime) && numericRuntime > 0 ? numericRuntime : null;
}

function getTrailer(videos = []) {
  return (
    videos.find(video => video.site === 'YouTube' && video.type === 'Trailer') ||
    videos.find(video => video.site === 'YouTube' && video.type === 'Teaser') ||
    videos.find(video => video.site === 'YouTube') ||
    null
  );
}

function formatConfidenceLabel(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 'Review score';
  if (score >= 92) return 'Lock this in';
  if (score >= 85) return 'Confident';
  if (score >= 78) return 'Strong';
  return 'Room for risk';
}

function mergeDetails(item, detailsBundle) {
  if (!detailsBundle?.details) return item;
  const details = detailsBundle.details;
  return {
    ...item,
    ...details,
    media_type: item.media_type || details.media_type,
    poster_path: details.poster_path || item.poster_path,
    backdrop_path: details.backdrop_path || item.backdrop_path,
    runtime: details.runtime ?? item.runtime,
    episode_run_time: details.episode_run_time || item.episode_run_time,
  };
}

function makeWatchHistoryKeys(history = []) {
  return history.map(item => getRecommendationKey(item, item.media_type || 'movie'));
}

function formatShareText({ mood, picks }) {
  const lines = picks.map(
    pick => `${pick.slotLabel}: ${getDisplayTitle(pick.item)} - ${pick.explanation}`
  );
  return [`MoodReel tonight card`, `Mood: ${mood || 'open'}`, ...lines].join('\n');
}

function TonightPickCard({
  pick,
  providerData,
  trailer,
  isInWatchlist,
  onToggleWatchlist,
  onPlayTrailer,
}) {
  const item = pick.item;
  const title = getDisplayTitle(item);
  const year = getReleaseYear(item);
  const runtime = getRuntime(item);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const detailPath = `/${item.media_type || 'movie'}/${item.id}`;
  const confidence = Number.isFinite(Number(pick.confidence)) ? Math.round(pick.confidence) : 0;
  const confidenceLabel = pick.confidenceLabel || formatConfidenceLabel(confidence);
  const topReasons = pick.reasons?.slice(0, 2) || [];

  return (
    <article className={`tonight-pick-card tonight-pick-card-${pick.slot}`}>
      <Link to={detailPath} state={{ item }} className="tonight-pick-media">
        <MediaImage
          path={item.backdrop_path || item.poster_path}
          type={item.backdrop_path ? 'backdrop' : 'poster'}
          size={item.backdrop_path ? 'w780' : 'w500'}
          alt={`${title} artwork`}
          loading={pick.slot === 'safe' ? 'eager' : 'lazy'}
        />
      </Link>

      <div className="tonight-pick-body">
        <div className="tonight-pick-slot-row">
          <span className="tonight-pick-slot">{pick.slotLabel}</span>
          <div className="tonight-pick-confidence-group">
            <span className="tonight-pick-confidence">{confidence}% match</span>
            <span className="tonight-pick-confidence-label">{confidenceLabel}</span>
          </div>
        </div>

        <div className="tonight-confidence-track" aria-hidden="true">
          <span className="tonight-confidence-fill" style={{ width: `${confidence}%` }} />
        </div>

        <h2>
          <Link to={detailPath} state={{ item }}>
            {title}
          </Link>
        </h2>

        <div className="tonight-pick-meta">
          {year && <span>{year}</span>}
          <span>{getTypeLabel(item)}</span>
          {rating && <span>{rating} TMDB</span>}
          {runtime && <span>{runtime} min</span>}
        </div>

        <ProviderBadges providers={providerData?.flatrate?.slice(0, 4) || []} />

        <div className="why-pick-block">
          <span>Why this pick?</span>
          <p>{pick.explanation || getDisplayOverview(item)}</p>
          {pick.debateLine && <small>{pick.debateLine}</small>}
        </div>

        {topReasons.length > 0 && (
          <div className="tonight-pick-reason-grid">
            {topReasons.map((reason, index) => (
              <span key={`${pick.slot}-${index}`}>✦ {reason}</span>
            ))}
          </div>
        )}

        <ScoreBreakdown rows={buildScoreBreakdown(pick)} title="Why it ranked" />

        {pick.tags?.length > 0 && (
          <div className="tonight-pick-tags">
            {pick.tags.map(tag => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}

        {pick.penalties?.length > 0 && (
          <p className="tonight-caveat">Caveat: {pick.penalties[0]}</p>
        )}

        <div className="tonight-pick-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => onToggleWatchlist(item)}
            aria-pressed={isInWatchlist}
          >
            {isInWatchlist ? 'Saved' : 'Save'}
          </button>
          <Link to={detailPath} state={{ item }} className="btn-secondary">
            Details
          </Link>
          {trailer && (
            <button type="button" className="btn-secondary" onClick={() => onPlayTrailer(trailer)}>
              Trailer
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Tonight() {
  const { pushToast } = useToasts();
  const { playTrailer } = useTrailer();
  const { addToHistory } = useMoodHistory();
  const { region, setRegion, myServices, toggleService } = useProviderSettings();
  const { watchlist, watchlistKeys, watchedKeys, isInWatchlist, toggleWatchlist } = useWatchlist();
  const { profile } = useTasteProfile();
  const { preferences, setPreference } = useTonightPreferences();
  const {
    mood,
    runtimeLimit,
    contentType,
    watchingContext,
    riskPreference,
    servicesOnly,
    minRating,
    hideDisliked,
    hideWatched,
  } = preferences;

  const [picks, setPicks] = useState([]);
  const [scorecards, setScorecards] = useState([]);
  const [providerSnapshot, setProviderSnapshot] = useState({});
  const [trailersByKey, setTrailersByKey] = useState({});
  const [genreMap, setGenreMap] = useState({});
  const [candidateCount, setCandidateCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const watchHistory = useMemo(() => safeGetJSON(SK.WATCH_HISTORY, []), []);
  const tasteSettings = useMemo(() => safeGetJSON(TASTE_SETTINGS_KEY, TASTE_SETTING_DEFAULTS), []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      searchService.fetchGenres('movie', controller.signal),
      searchService.fetchGenres('tv', controller.signal),
    ])
      .then(([movieGenres, tvGenres]) => {
        const next = {};
        [...movieGenres, ...tvGenres].forEach(genre => {
          next[genre.id] = genre.name;
        });
        setGenreMap(next);
      })
      .catch(err => {
        if (!shouldSkipLog(err)) {
          console.warn('Failed to load genres for Tonight insights', err);
        }
      });
    return () => controller.abort();
  }, []);

  const runtimeOption = useMemo(
    () =>
      RUNTIME_OPTIONS.find(option => option.value === Number(runtimeLimit)) || RUNTIME_OPTIONS[0],
    [runtimeLimit]
  );

  const watchlistGenreCounts = useMemo(() => {
    return watchlist.reduce((acc, item) => {
      (item.genre_ids || []).forEach(genreId => {
        acc[genreId] = (acc[genreId] || 0) + 1;
      });
      return acc;
    }, {});
  }, [watchlist]);

  const tasteInsights = useMemo(() => {
    const genreRows = Object.entries(watchlistGenreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => `${genreMap[id] || `Genre ${id}`} (${count})`);
    const dislikedSet = new Set(profile?.disliked || []);
    const dislikedGenres = scorecards
      .filter(scorecard => dislikedSet.has(scorecard.key))
      .flatMap(scorecard => scorecard.item.genre_ids || []);
    const dislikedGenreRows = Object.entries(
      dislikedGenres.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => genreMap[id] || `Genre ${id}`);

    return {
      likedGenres: genreRows.length ? genreRows.join(', ') : 'Save titles to reveal genre pull.',
      skippedGenres: dislikedGenreRows.length
        ? dislikedGenreRows.join(', ')
        : 'Dislikes will show avoided genres here.',
      moodPatterns: mood ? `Tonight is tuned to "${mood}".` : 'No vibe entered yet.',
      savedVsWatched: `${watchlist.length} saved, ${watchedKeys.size} marked watched.`,
    };
  }, [
    genreMap,
    mood,
    profile?.disliked,
    scorecards,
    watchedKeys.size,
    watchlist.length,
    watchlistGenreCounts,
  ]);

  const loadTonightPicks = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setError('');
    setPicks([]);

    const selectedContext = WATCHING_CONTEXTS.find(context => context.id === watchingContext);
    const query = [mood.trim(), selectedContext?.mood].filter(Boolean).join(' ') || 'movie night';
    const selectedMode =
      TONIGHT_MODES.find(mode => query.toLowerCase().includes(mode.label.toLowerCase())) ||
      TONIGHT_MODES[0];

    try {
      if (mood.trim()) addToHistory(mood.trim());

      const result = await searchService.search(
        {
          query,
          type: contentType,
          genres: [],
          providers: servicesOnly ? myServices : [],
          minRating,
          matchType: 'any',
          region,
          runtime: runtimeOption.searchRuntime,
          sortBy: riskPreference === 'adventurous' ? 'vote_average.desc' : 'popularity.desc',
          page: 1,
          multiPage: true,
        },
        controller.signal,
        { tasteProfile: profile }
      );

      if (result.error && !result.results?.length) {
        setError(result.error);
      }

      const candidates = (result.results || []).slice(0, 24);
      setCandidateCount(candidates.length);

      const providerEntries = await Promise.all(
        candidates.map(async item => {
          const mediaType = item.media_type || (contentType === 'tv' ? 'tv' : 'movie');
          const key = getRecommendationKey(item, mediaType);
          try {
            const providerData = await fetchTitleProviders(
              item.id,
              mediaType,
              region,
              controller.signal
            );
            return [key, providerData];
          } catch (err) {
            if (!shouldSkipLog(err)) {
              console.warn('Provider lookup failed for Tonight Mode', err);
            }
            return [key, null];
          }
        })
      );

      const detailsEntries = await Promise.all(
        candidates.slice(0, 18).map(async item => {
          const mediaType = item.media_type || (contentType === 'tv' ? 'tv' : 'movie');
          const key = getRecommendationKey(item, mediaType);
          try {
            const details = await searchService.fetchContentDetails(
              item.id,
              mediaType,
              controller.signal
            );
            return [key, details];
          } catch (err) {
            if (!shouldSkipLog(err)) {
              console.warn('Details lookup failed for Tonight Mode', err);
            }
            return [key, null];
          }
        })
      );

      const providersByKey = Object.fromEntries(providerEntries);
      const detailsByKey = Object.fromEntries(detailsEntries);
      const trailers = {};
      const enriched = candidates.map(item => {
        const mediaType = item.media_type || (contentType === 'tv' ? 'tv' : 'movie');
        const key = getRecommendationKey(item, mediaType);
        const details = detailsByKey[key];
        const trailer = getTrailer(details?.videos || []);
        if (trailer) trailers[key] = trailer;
        return mergeDetails(item, details);
      });

      const savedKeys = Array.from(watchlistKeys);
      const ranked = rankRecommendations(enriched, {
        mode: selectedMode,
        moodText: query,
        constraints: [
          'high-rating',
          runtimeLimit && Number(runtimeLimit) <= 90 ? 'under-90' : 'low-commitment',
          servicesOnly ? 'streaming-now' : '',
          watchingContext === 'family' ? 'family-friendly' : '',
          riskPreference === 'adventurous' ? 'wild-card' : '',
        ].filter(Boolean),
        providerDataByKey: providersByKey,
        myServices,
        servicesOnly,
        likedKeys: profile?.liked || [],
        dislikedKeys: profile?.disliked || [],
        savedKeys,
        watchedKeys: Array.from(watchedKeys),
        watchHistoryKeys: makeWatchHistoryKeys(watchHistory),
        hideDisliked,
        hideWatched,
        watchlistGenreCounts,
        tasteSettings,
        contentType,
        maxRuntime: Number(runtimeLimit || 0),
        watchingContext,
        riskPreference,
      });
      const nextPicks = buildTonightPicks(ranked);

      setProviderSnapshot(providersByKey);
      setTrailersByKey(trailers);
      setScorecards(ranked);
      setPicks(nextPicks);

      if (nextPicks.length < 3) {
        setError('MoodReel needs a broader vibe or fewer filters to make all three picks.');
      }
    } catch (err) {
      if (!shouldSkipLog(err)) {
        console.error('Tonight Mode failed', err);
      }
      setError(getUserFacingMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [
    addToHistory,
    contentType,
    hideDisliked,
    hideWatched,
    minRating,
    mood,
    myServices,
    profile,
    region,
    riskPreference,
    runtimeLimit,
    runtimeOption.searchRuntime,
    servicesOnly,
    tasteSettings,
    watchedKeys,
    watchingContext,
    watchHistory,
    watchlistGenreCounts,
    watchlistKeys,
  ]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleSubmit = event => {
    event.preventDefault();
    loadTonightPicks();
  };

  const handleShare = useCallback(async () => {
    if (picks.length === 0) return;
    const text = formatShareText({ mood, picks });
    try {
      if (navigator.share) {
        await navigator.share({ title: 'MoodReel tonight card', text });
      } else {
        await copyToClipboard(text);
      }
      pushToast({
        icon: 'Link',
        title: 'Tonight card ready',
        message: 'The three-pick decision card was shared or copied.',
        duration: 2800,
      });
    } catch {
      pushToast({
        icon: '!',
        title: 'Share cancelled',
        message: 'No changes were made.',
        duration: 2200,
      });
    }
  }, [mood, picks, pushToast]);

  const compareRows = useMemo(() => {
    return picks.map(pick => ({
      label:
        pick.slot === 'safe'
          ? 'Best safe pick'
          : pick.slot === 'wild'
            ? 'Best wild pick'
            : 'Best for tonight',
      title: getDisplayTitle(pick.item),
      wins: pick.reasons?.slice(0, 2).join(', ') || 'strongest overall fit',
      loses: pick.penalties?.[0] || 'no major caveat',
    }));
  }, [picks]);

  return (
    <main className="page-enter tonight-page">
      <section className="tonight-hero">
        <div className="tonight-hero-copy">
          <span className="section-kicker">Tonight Mode</span>
          <h1>Find what to watch tonight.</h1>
          <p>
            Tell MoodReel your vibe, time, services, and watching context. It returns a Safe Bet,
            Best Match, and Wild Card with reasons you can actually use.
          </p>
        </div>
        <div className="tonight-hero-proof">
          <strong>{picks.length || 3}</strong>
          <span>explained picks</span>
          <small>
            {candidateCount ? `${candidateCount} candidates ranked` : 'No doomscrolling'}
          </small>
        </div>
      </section>

      <form className="tonight-decision-panel" onSubmit={handleSubmit}>
        <label className="tonight-field tonight-vibe-field">
          <span>Vibe</span>
          <input
            value={mood}
            onChange={event => setPreference('mood', event.target.value)}
            placeholder="low effort, smart, funny, rainy night..."
          />
        </label>

        <label className="tonight-field">
          <span>Available time</span>
          <select
            value={runtimeLimit}
            onChange={event => setPreference('runtimeLimit', Number(event.target.value))}
          >
            {RUNTIME_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="tonight-field">
          <span>Content</span>
          <select
            value={contentType}
            onChange={event => setPreference('contentType', event.target.value)}
          >
            <option value="all">All</option>
            <option value="movie">Movies</option>
            <option value="tv">TV</option>
          </select>
        </label>

        <label className="tonight-field">
          <span>Region</span>
          <input value={region} onChange={event => setRegion(event.target.value.toUpperCase())} />
        </label>

        <div className="tonight-control-group" role="group" aria-label="Watching context">
          <span>Watching context</span>
          <div className="tonight-segmented">
            {WATCHING_CONTEXTS.map(context => (
              <button
                key={context.id}
                type="button"
                className={watchingContext === context.id ? 'active' : ''}
                aria-pressed={watchingContext === context.id}
                onClick={() => setPreference('watchingContext', context.id)}
              >
                {context.label}
              </button>
            ))}
          </div>
        </div>

        <div className="tonight-control-group" role="group" aria-label="Risk preference">
          <span>Preference</span>
          <div className="tonight-segmented">
            {RISK_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                className={riskPreference === option.id ? 'active' : ''}
                aria-pressed={riskPreference === option.id}
                onClick={() => setPreference('riskPreference', option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="tonight-field tonight-rating-field">
          <span>Minimum rating: {minRating.toFixed(1)}+</span>
          <input
            type="range"
            min="0"
            max="9"
            step="0.5"
            value={minRating}
            onChange={event => setPreference('minRating', Number(event.target.value))}
          />
        </label>

        <div className="tonight-service-panel">
          <div className="tonight-service-head">
            <div>
              <span>Services</span>
              <p>Services-only boosts titles you can stream where you already pay.</p>
            </div>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={servicesOnly}
                onChange={event => setPreference('servicesOnly', event.target.checked)}
              />
              Services-only
            </label>
          </div>
          <div className="service-quick-grid" role="group" aria-label="Streaming services">
            {TOP_STREAMING_SERVICES.map(service => (
              <button
                key={service.id}
                type="button"
                className={`service-quick-chip ${myServices.includes(service.id) ? 'active' : ''}`}
                aria-pressed={myServices.includes(service.id)}
                onClick={() => toggleService(service.id)}
              >
                {service.label}
              </button>
            ))}
          </div>
        </div>

        <div className="tonight-privacy-row">
          <label>
            <input
              type="checkbox"
              checked={hideDisliked}
              onChange={event => setPreference('hideDisliked', event.target.checked)}
            />
            Hide disliked
          </label>
          <label>
            <input
              type="checkbox"
              checked={hideWatched}
              onChange={event => setPreference('hideWatched', event.target.checked)}
            />
            Hide watched
          </label>
        </div>

        <button type="submit" className="primary-button tonight-submit" disabled={isLoading}>
          {isLoading ? 'Finding picks...' : "Find Tonight's Picks"}
        </button>
      </form>

      {error && <ErrorState title="Tonight Mode" message={error} onRetry={loadTonightPicks} />}

      {isLoading && (
        <div className="tonight-loading-grid" aria-label="Loading Tonight picks">
          <MovieCardSkeleton />
          <MovieCardSkeleton />
          <MovieCardSkeleton />
        </div>
      )}

      {!isLoading && picks.length === 0 && !error && (
        <section className="tonight-empty-state">
          <div className="tonight-empty-state-icon" aria-hidden="true">
            🛋️
          </div>
          <h2>Ready when the couch is.</h2>
          <p>
            Set the vibe, available time, and services, then ask MoodReel for three explained picks.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              const input = document.querySelector('.tonight-vibe-field input');
              input?.focus();
            }}
          >
            Set the vibe
          </button>
        </section>
      )}

      {picks.length > 0 && (
        <>
          <section className="tonight-picks-grid" aria-label="Tonight picks">
            {picks.map(pick => {
              const item = pick.item;
              const key = getRecommendationKey(item, item.media_type || 'movie');
              const providerData = providerSnapshot[key];
              const trailer = trailersByKey[key];
              return (
                <TonightPickCard
                  key={key}
                  pick={pick}
                  providerData={providerData}
                  trailer={trailer}
                  isInWatchlist={isInWatchlist(item.id, item.media_type || 'movie')}
                  onToggleWatchlist={toggleWatchlist}
                  onPlayTrailer={video => playTrailer(video.key, getDisplayTitle(item))}
                />
              );
            })}
          </section>

          <section className="tonight-share-card" aria-label="Share Tonight picks">
            <div>
              <span className="section-kicker">Share card</span>
              <h2>MoodReel tonight card</h2>
              <p>
                {picks.map(pick => `${pick.slotLabel}: ${getDisplayTitle(pick.item)}`).join(' / ')}
              </p>
            </div>
            <button type="button" className="btn-secondary" onClick={handleShare}>
              Share or copy
            </button>
          </section>

          <section className="pick-between-panel tonight-compare-panel">
            <div className="pick-between-intro">
              <span className="section-kicker">Pick Between These</span>
              <h2>Why each pick wins</h2>
              <p>Use this when the shortlist still needs a final call.</p>
            </div>
            <div className="tonight-compare-grid">
              {compareRows.map(row => (
                <article key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.title}</strong>
                  <p>Wins: {row.wins}</p>
                  <p>Loses: {row.loses}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="tonight-insights-panel">
        <span className="section-kicker">Taste graph</span>
        <h2>Local signals used tonight</h2>
        <div className="tonight-insights-grid">
          <article>
            <span>Common liked genres</span>
            <p>{tasteInsights.likedGenres}</p>
          </article>
          <article>
            <span>Skipped or disliked</span>
            <p>{tasteInsights.skippedGenres}</p>
          </article>
          <article>
            <span>Mood pattern</span>
            <p>{tasteInsights.moodPatterns}</p>
          </article>
          <article>
            <span>Saved vs watched</span>
            <p>{tasteInsights.savedVsWatched}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
