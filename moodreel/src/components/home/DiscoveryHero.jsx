import { Link } from 'react-router-dom';
import { getDisplayTitle, getDisplayOverview, getReleaseYear } from '../../utils/mediaUtils';
import MediaImage from '../MediaImage';
import { DiscoveryHeroSkeleton } from '../Skeleton';

const CONTENT_TYPES = [
  { id: 'all', label: 'All', helper: 'Movies + TV' },
  { id: 'movie', label: 'Movies', helper: 'Feature picks' },
  { id: 'tv', label: 'TV', helper: 'Series mode' },
];

const STARTER_VIBES = [
  { label: 'Date night', mood: 'date night with charm and momentum' },
  { label: 'Comfort', mood: 'cozy comfort watch' },
  { label: 'Brain off', mood: 'easy funny low commitment' },
  { label: 'Dark gem', mood: 'moody hidden gem thriller' },
];

export default function DiscoveryHero({
  isLoading,
  featuredItem,
  featuredLink,
  heroTitle,
  heroDescription,
  heroMoodLabel,
  activeFilterCount = 0,
  selectedGenres = [],
  myServices = [],
  timeContext,
  mood,
  setMood,
  handleSearch,
  isBusy,
  contentType,
  setContentType,
  setRecommendations,
  setHasSearched,
  moodInputRef,
  recentMoods,
  playSound,
  primaryActionLabel = 'Discover',
}) {
  if (isLoading && !featuredItem) {
    return <DiscoveryHeroSkeleton />;
  }

  const featuredArtSources = featuredItem
    ? [
        featuredItem.backdrop_path
          ? { path: featuredItem.backdrop_path, type: 'backdrop', size: 'w780' }
          : null,
        featuredItem.poster_path
          ? { path: featuredItem.poster_path, type: 'poster', size: 'w500' }
          : null,
      ].filter(Boolean)
    : [];

  const activeSignalCount = [mood, selectedGenres.length > 0, myServices.length > 0, activeFilterCount > 0]
    .filter(Boolean).length;

  const runStarterVibe = starterMood => {
    setMood(starterMood);
    playSound?.('pop');
    window.setTimeout(() => handleSearch(), 0);
  };

  return (
    <section className={`discovery-hero cinema-hero ${isBusy ? 'is-busy' : ''}`}>
      <div className="cinema-hero-orb cinema-hero-orb-one" aria-hidden="true" />
      <div className="cinema-hero-orb cinema-hero-orb-two" aria-hidden="true" />

      <div className="discovery-hero-copy cinema-hero-copy">
        <div className="hero-kicker-row">
          <span className="hero-kicker">MoodReel</span>
          <span className="hero-live-chip" aria-live="polite">
            {timeContext?.emoji || '🎬'} {heroMoodLabel || mood || 'ready'}
          </span>
        </div>

        <h2>{heroTitle}</h2>
        <p className="hero-description">{heroDescription}</p>

        <div className="hero-signal-grid" aria-label="Current discovery setup">
          <span>
            <strong>{contentType === 'all' ? 'All' : contentType === 'tv' ? 'TV' : 'Movies'}</strong>
            <small>Scope</small>
          </span>
          <span>
            <strong>{activeFilterCount}</strong>
            <small>Filters</small>
          </span>
          <span>
            <strong>{myServices.length || 'Any'}</strong>
            <small>Services</small>
          </span>
          <span>
            <strong>{activeSignalCount}/4</strong>
            <small>Signals</small>
          </span>
        </div>

        <div className="hero-search-surface cinema-search-surface">
          <div className="content-toggle-tabs cinema-content-tabs" role="group" aria-label="Content type">
            {CONTENT_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                className={`content-tab ${contentType === type.id ? 'active' : ''}`}
                aria-pressed={contentType === type.id}
                onClick={() => {
                  setContentType(type.id);
                  setRecommendations([]);
                  setHasSearched(false);
                  playSound?.('pop');
                }}
              >
                <span>{type.label}</span>
                <small>{type.helper}</small>
              </button>
            ))}
          </div>

          <div className="mood-input-wrapper cinema-mood-input">
            <span className="mood-icon" aria-hidden="true">
              ✦
            </span>
            <input
              ref={moodInputRef}
              type="text"
              value={mood}
              onChange={e => setMood(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Describe the exact watch vibe"
              aria-label="Search by mood"
            />
            {mood && (
              <button
                type="button"
                className="mood-clear-btn"
                onClick={() => setMood('')}
                aria-label="Clear mood"
              >
                ✕
              </button>
            )}
          </div>

          <div className="starter-vibe-row" aria-label="Quick vibe starters">
            {STARTER_VIBES.map(vibe => (
              <button key={vibe.label} type="button" onClick={() => runStarterVibe(vibe.mood)}>
                {vibe.label}
              </button>
            ))}
          </div>

          <div className="hero-search-actions cinema-hero-actions">
            <button
              className="primary-button hero-primary-action"
              type="button"
              onClick={handleSearch}
              disabled={isBusy}
            >
              <span>{isBusy ? 'Tuning…' : primaryActionLabel}</span>
              <span aria-hidden="true">→</span>
            </button>
            {recentMoods.length > 0 && !mood && (
              <div className="recent-moods">
                {recentMoods.slice(0, 4).map((recentMood, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="recent-mood-chip"
                    onClick={() => {
                      setMood(recentMood);
                      playSound('pop');
                    }}
                  >
                    {recentMood}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="discovery-hero-visual cinema-hero-visual">
        {featuredItem ? (
          <Link to={featuredLink} className="hero-featured-card cinema-featured-card">
            <div className="hero-featured-art">
              <MediaImage
                type="backdrop"
                path={featuredItem.backdrop_path || featuredItem.poster_path}
                sources={featuredArtSources}
                alt={getDisplayTitle(featuredItem)}
                loading="eager"
              />
              <div className="hero-featured-overlay" />
            </div>
            <div className="hero-featured-copy cinema-featured-copy">
              <span className="hero-featured-eyebrow">Tonight spotlight</span>
              <h3>{getDisplayTitle(featuredItem)}</h3>
              <p>{getDisplayOverview(featuredItem)}</p>
              <div className="hero-featured-meta">
                {getReleaseYear(featuredItem) && <span>{getReleaseYear(featuredItem)}</span>}
                {featuredItem.vote_average ? <span>{featuredItem.vote_average.toFixed(1)} / 10</span> : null}
                <span>{featuredItem.media_type === 'tv' ? 'Series' : 'Film'}</span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="hero-featured-card hero-featured-card-empty cinema-featured-card">
            <span className="hero-featured-eyebrow">Loading spotlight</span>
            <h3>MoodReel is finding a fit</h3>
            <p>The featured pick will appear as soon as the discovery feed lands.</p>
          </div>
        )}
      </div>
    </section>
  );
}
