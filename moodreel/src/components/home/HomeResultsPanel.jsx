import MovieCard from '../MovieCard';
import SwipeCard from '../SwipeCard';
import EmptyState from '../EmptyState';
import { SkeletonGrid, MovieCardSkeleton } from '../Skeleton';

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
  handleSaveVibe,
  setMood,
  hasMore,
  isLoading,
  loadMoreResults,
  searchScope,
  loadMoreRef,
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
                isInWatchlist={isInWatchlist(rec.id)}
                onToggleWatchlist={toggleWatchlist}
                isWatched={isWatched(rec.id)}
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
                index={idx}
              />
            ))}
            {hasAnySearch && !isBusy && filteredByServices.length === 0 && (
              <EmptyState
                icon="✨"
                title="No results found"
                description="Try a different mood or clear your filters!"
                onActionClick={() => setMood('')}
                actionText="Clear Search"
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
