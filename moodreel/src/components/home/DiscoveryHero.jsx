import { Link } from 'react-router-dom';
import {
  getBackdropUrl,
  getDisplayTitle,
  getDisplayOverview,
  getReleaseYear,
} from '../../utils/mediaUtils';
import { DiscoveryHeroSkeleton } from '../Skeleton';

export default function DiscoveryHero({
  isLoading,
  featuredItem,
  featuredLink,
  heroTitle,
  heroDescription,
  heroMoodLabel,
  activeFilterCount,
  mood,
  selectedGenres,
  myServices,
  timeContext,
  handleSearch,
  setMood,
  isSurpriseLoading,
  handleSurpriseMe,
  hasAnySearch,
}) {
  if (isLoading && !featuredItem) {
    return <DiscoveryHeroSkeleton />;
  }

  return (
    <section className="discovery-hero">
      <div className="discovery-hero-copy">
        <span className="hero-kicker">MoodReel / discovery engine</span>
        <h2>{heroTitle}</h2>
        <p className="hero-description">{heroDescription}</p>
        <div className="hero-proof-row">
          <span className="hero-proof">Mood: {heroMoodLabel}</span>
          <span className="hero-proof">
            {selectedGenres.length > 0 ? `${selectedGenres.length} genres` : 'All genres'}
          </span>
          <span className="hero-proof">
            {myServices.length > 0 ? `${myServices.length} services` : 'Any service'}
          </span>
          <span className="hero-proof">{activeFilterCount} filters</span>
        </div>
        <div className="hero-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              if (!mood) {
                setMood(timeContext.suggestion);
                window.setTimeout(() => handleSearch(), 0);
                return;
              }
              handleSearch();
            }}
          >
            {mood ? 'Search this mood' : `Try “${timeContext.suggestion}”`}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleSurpriseMe}
            disabled={isSurpriseLoading}
          >
            {isSurpriseLoading ? 'Shuffling…' : 'Surprise Me'}
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => window.dispatchEvent(new CustomEvent('moodreel:focus-mood-search'))}
          >
            Focus search
          </button>
        </div>
        <p className="hero-hint">
          Press <kbd>⌘</kbd> <kbd>K</kbd> for the quick-action palette.
        </p>
      </div>

      <div className="discovery-hero-visual">
        {featuredItem ? (
          <Link to={featuredLink} className="hero-featured-card">
            <div className="hero-featured-art">
              <img
                src={getBackdropUrl(featuredItem.backdrop_path, 'w780')}
                alt={getDisplayTitle(featuredItem)}
                loading="eager"
                decoding="async"
              />
              <div className="hero-featured-overlay" />
            </div>
            <div className="hero-featured-copy">
              <span className="hero-featured-eyebrow">
                {hasAnySearch ? 'Current spotlight' : 'Trending spotlight'}
              </span>
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
