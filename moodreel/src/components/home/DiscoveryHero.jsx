import { Link } from 'react-router-dom';
import { getDisplayTitle, getDisplayOverview, getReleaseYear } from '../../utils/mediaUtils';
import MediaImage from '../MediaImage';
import { DiscoveryHeroSkeleton } from '../Skeleton';

export default function DiscoveryHero({
  isLoading,
  featuredItem,
  featuredLink,
  heroTitle,
  heroDescription,
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
}) {
  if (isLoading && !featuredItem) {
    return <DiscoveryHeroSkeleton />;
  }

  return (
    <section className="discovery-hero">
      <div className="discovery-hero-copy">
        <span className="hero-kicker">MoodReel</span>
        <h2>{heroTitle}</h2>
        <p className="hero-description">{heroDescription}</p>

        {/* Unified search surface */}
        <div className="hero-search-surface">
          <div className="content-toggle-tabs" role="group" aria-label="Content type">
            {['all', 'movie', 'tv'].map(type => (
              <button
                key={type}
                type="button"
                className={`content-tab ${contentType === type ? 'active' : ''}`}
                aria-pressed={contentType === type}
                onClick={() => {
                  setContentType(type);
                  setRecommendations([]);
                  setHasSearched(false);
                }}
              >
                {type === 'all' ? 'All' : type === 'movie' ? 'Movies' : 'TV'}
              </button>
            ))}
          </div>

          <div className="mood-input-wrapper">
            <span className="mood-icon" aria-hidden="true">
              ✨
            </span>
            <input
              ref={moodInputRef}
              type="text"
              value={mood}
              onChange={e => setMood(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="What's your mood tonight?"
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

          <div className="hero-search-actions">
            <button
              className="primary-button"
              type="button"
              onClick={handleSearch}
              disabled={isBusy}
            >
              {isBusy ? 'Searching…' : 'Discover'}
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

      <div className="discovery-hero-visual">
        {featuredItem ? (
          <Link to={featuredLink} className="hero-featured-card">
            <div className="hero-featured-art">
              <MediaImage
                type="backdrop"
                path={featuredItem.backdrop_path || featuredItem.poster_path}
                size={featuredItem.backdrop_path ? 'w780' : 'w500'}
                alt={getDisplayTitle(featuredItem)}
                loading="eager"
              />
              <div className="hero-featured-overlay" />
            </div>
            <div className="hero-featured-copy">
              <span className="hero-featured-eyebrow">Trending spotlight</span>
              <h3>{getDisplayTitle(featuredItem)}</h3>
              <p>{getDisplayOverview(featuredItem)}</p>
              <div className="hero-featured-meta">
                {getReleaseYear(featuredItem) && <span>{getReleaseYear(featuredItem)}</span>}
                {featuredItem.vote_average ? (
                  <span>{featuredItem.vote_average.toFixed(1)} / 10</span>
                ) : null}
                <span>{featuredItem.media_type === 'tv' ? 'Series' : 'Film'}</span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="hero-featured-card hero-featured-card-empty">
            <span className="hero-featured-eyebrow">Loading spotlight</span>
            <h3>MoodReel is finding a fit</h3>
            <p>The featured pick will appear as soon as the discovery feed lands.</p>
          </div>
        )}
      </div>
    </section>
  );
}
