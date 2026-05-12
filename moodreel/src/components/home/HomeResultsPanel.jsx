import MovieCard from '../MovieCard';
import SwipeCard from '../SwipeCard';
import EmptyState from '../EmptyState';
import { SkeletonGrid, MovieCardSkeleton } from '../Skeleton';
import { getDisplayOverview, getDisplayTitle, getReleaseYear } from '../../utils/mediaUtils';
import { getRecommendationKey } from '../../utils/recommendationScoring';

export default function HomeResultsPanel({
  isBusy,
  filteredByServices,
  isMobile,
  hasAnySearch,
  isCardLoading,
  handleSwipeLeft,
  handleSwipeRight,
  filteredByServicesFirst,
  filteredByServicesSecond,
  visibleCount,
  resultLayout,
  isInWatchlist,
  toggleWatchlist,
  isWatched,
  toggleWatched,
  providerSnapshot,
  getProviderKey,
  getCachedTitleProvidersFn,
  region,
  like,
  dislike,
  tasteCounts,
  showHidden,
  setShowHidden,
  statusFor,
  getRecommendationReason,
  handleSaveVibe,
  setMood,
  handleClearFilters,
  hasMore,
  isLoading,
  loadMoreResults,
  searchScope,
  loadMoreRef,
  activeTonightMode,
  tonightPicks = [],
  lockedPickId,
  onPickCandidate,
  onPassCandidate,
}) {
  return (
    <div aria-live="polite">
      {isBusy && filteredByServices.length === 0 ? (
        <SkeletonGrid count={8} />
      ) : isMobile && hasAnySearch && filteredByServices.length > 0 ? (
        <div className="swipe-container" style={{ textAlign: 'center' }}>
          {isCardLoading ? (
            <MovieCardSkeleton />
          ) : (
            <SwipeCard
              movie={filteredByServicesFirst}
              nextMovie={filteredByServicesSecond}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              mediaType={filteredByServicesFirst?.media_type}
            />
          )}
        </div>
      ) : (
        <div className="recommendations-container">
          {filteredByServices.length > 1 && tonightPicks.length > 0 && (
            <section className="pick-between-panel" aria-labelledby="pick-between-heading">
              <div className="pick-between-intro">
                <span className="section-kicker">Pick Between These</span>
                <h2 id="pick-between-heading">
                  Shortlist for {activeTonightMode.label.toLowerCase()}
                </h2>
                <p>{activeTonightMode.decisionCopy} Three picks, no doomscroll.</p>
              </div>
              <div className="pick-between-grid">
                {tonightPicks.map(pick => {
                  const item = pick.item;
                  const key = getRecommendationKey(item, item.media_type || 'movie');
                  const isLocked = lockedPickId === key;
                  const title = getDisplayTitle(item);
                  const year = getReleaseYear(item);
                  const overview = getDisplayOverview(item);
                  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
                  const reason = pick.explanation || getRecommendationReason?.(item);

                  return (
                    <article key={key} className={`pick-between-card ${isLocked ? 'locked' : ''}`}>
                      <div className="pick-between-card-head">
                        <span className="pick-between-rank">
                          {isLocked ? 'Locked' : pick.slotLabel}
                        </span>
                        {rating && <span className="pick-between-rating">{rating} / 10</span>}
                      </div>
                      <h3>{title}</h3>
                      <p>{reason || overview}</p>
                      <div className="pick-between-meta">
                        {year && <span>{year}</span>}
                        <span>{item.media_type === 'tv' ? 'Series' : 'Film'}</span>
                      </div>
                      <div className="pick-between-actions">
                        <button
                          type="button"
                          className="primary-button pick-between-pick"
                          onClick={() => onPickCandidate(item)}
                        >
                          {isLocked ? 'Picked' : 'Pick this'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary pick-between-pass"
                          onClick={() => onPassCandidate(item)}
                        >
                          Swap out
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {filteredByServices.length > 0 && (
            <div className="results-header">
              <div className="results-meta">
                <h2>
                  Results <span className="results-count">{filteredByServices.length}</span>
                </h2>
                <div className="results-meta-row">
                  {(tasteCounts.liked > 0 || tasteCounts.disliked > 0) && (
                    <div className="taste-summary">
                      {tasteCounts.liked > 0 && (
                        <span className="taste-liked">👍 {tasteCounts.liked}</span>
                      )}
                      {tasteCounts.disliked > 0 && (
                        <span className="taste-disliked">👎 {tasteCounts.disliked}</span>
                      )}
                    </div>
                  )}
                  <label className="show-hidden-toggle">
                    <input
                      type="checkbox"
                      checked={showHidden}
                      onChange={e => setShowHidden(e.target.checked)}
                    />
                    Show hidden
                  </label>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary btn-sm save-vibe-btn"
                onClick={handleSaveVibe}
              >
                ✨ Save Vibe
              </button>
            </div>
          )}
          <div
            className={`recommendations ${resultLayout === 'rows' ? 'recommendations-list-mode' : ''}`}
          >
            {filteredByServices.slice(0, visibleCount).map((rec, idx) => (
              <MovieCard
                key={rec.id}
                movie={rec}
                displayMode={resultLayout === 'rows' ? 'row' : 'poster'}
                isInWatchlist={isInWatchlist(rec.id, rec.media_type)}
                onToggleWatchlist={toggleWatchlist}
                isWatched={isWatched(rec.id, rec.media_type)}
                onToggleWatched={toggleWatched}
                mediaType={rec.media_type}
                providerBadges={
                  (
                    providerSnapshot[getProviderKey(rec)] ||
                    getCachedTitleProvidersFn(rec.id, rec.media_type, region)
                  )?.flatrate?.slice(0, 3) || []
                }
                onLike={like}
                onDislike={dislike}
                tasteStatus={statusFor(rec.id, rec.media_type)}
                reason={getRecommendationReason?.(rec)}
                index={idx}
              />
            ))}
            {hasAnySearch && !isBusy && filteredByServices.length === 0 && (
              <EmptyState
                icon="✨"
                title="No results found"
                description="Try a different mood or reset your active filters."
                onActionClick={() => {
                  setMood('');
                  handleClearFilters();
                }}
                actionText="Reset Search"
              />
            )}
          </div>
        </div>
      )}

      {hasMore && !isMobile && searchScope !== 'all' && (
        <div ref={loadMoreRef} className="load-more-indicator">
          {isLoading ? (
            <>
              <span className="loading-spinner lg"></span>
              <span>Loading more...</span>
            </>
          ) : (
            <button type="button" className="btn-secondary" onClick={loadMoreResults}>
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
