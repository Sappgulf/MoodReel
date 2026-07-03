import React, { useState } from 'react';
import MovieCard from '../MovieCard';
import SwipeCard from '../SwipeCard';
import EmptyState from '../EmptyState';
import { SkeletonGrid, MovieCardSkeleton } from '../Skeleton';
import { downloadVibeIcs } from '../../utils/icsExport';

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
  handleShareVibe,
  scheduleVibeUrl,
  setMood,
  handleClearFilters,
  hasMore,
  isLoading,
  loadMoreResults,
  searchScope,
  loadMoreRef,
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleWhen, setScheduleWhen] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [scheduleDuration, setScheduleDuration] = useState(120);

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
              <div className="results-actions">
                <button
                  type="button"
                  className="btn-secondary btn-sm save-vibe-btn"
                  onClick={handleSaveVibe}
                >
                  ✨ Save Vibe
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-sm share-vibe-btn"
                  onClick={handleShareVibe}
                  aria-label="Copy shareable link for this vibe"
                  title="Copy a shareable link for this vibe"
                >
                  🔗 Share Vibe
                </button>
                {scheduleVibeUrl && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm schedule-vibe-btn"
                    onClick={() => setScheduleOpen(true)}
                    aria-label="Schedule this vibe on your calendar"
                    title="Add to your calendar"
                  >
                    📅 Schedule
                  </button>
                )}
              </div>
              {scheduleVibeUrl && scheduleOpen && (
                <div className="schedule-vibe-form">
                  <label>
                    When
                    <input
                      type="datetime-local"
                      value={scheduleWhen}
                      onChange={e => setScheduleWhen(e.target.value)}
                    />
                  </label>
                  <label>
                    Minutes
                    <input
                      type="number"
                      min="30"
                      max="300"
                      step="15"
                      value={scheduleDuration}
                      onChange={e => setScheduleDuration(Number(e.target.value))}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() => {
                      const when = scheduleWhen ? new Date(scheduleWhen) : new Date();
                      downloadVibeIcs({
                        title: 'Watch a MoodReel vibe',
                        startAt: when,
                        durationMinutes: scheduleDuration,
                        description: `Open MoodReel to see the picks: ${scheduleVibeUrl}`,
                        url: scheduleVibeUrl,
                      });
                      setScheduleOpen(false);
                    }}
                  >
                    Add to calendar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setScheduleOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
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
