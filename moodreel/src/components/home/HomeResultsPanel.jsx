import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MediaImage from '../MediaImage';
import MovieCard from '../MovieCard';
import SwipeCard from '../SwipeCard';
import EmptyState from '../EmptyState';
import { SkeletonGrid, MovieCardSkeleton } from '../Skeleton';
import { getDisplayOverview, getDisplayTitle, getReleaseYear } from '../../utils/mediaUtils';
import { getRecommendationKey } from '../../utils/recommendationScoring';
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
  activeTonightMode,
  tonightPicks = [],
  lockedPickId,
  activeConstraintLabels = [],
  decisionStats = {},
  decisionFeedback = {},
  decisionFeedbackOptions = [],
  rerollOptions = [],
  myServicesCount = 0,
  onPickCandidate,
  onPassCandidate,
  onFeedbackCandidate,
  onRerollCandidate,
  onShareTonight,
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
          {filteredByServices.length > 1 && tonightPicks.length > 0 && (
            <section className="pick-between-panel" aria-labelledby="pick-between-heading">
              <div className="pick-between-intro">
                <span className="section-kicker">Pick Between These</span>
                <h2 id="pick-between-heading">
                  Shortlist for {activeTonightMode.label.toLowerCase()}
                </h2>
                <p>{activeTonightMode.decisionCopy} Three picks, no doomscroll.</p>
                <div className="decision-scoreboard" aria-label="Tonight decision summary">
                  <span>
                    {decisionStats.topConfidence || tonightPicks[0]?.confidence || 0}% top match
                  </span>
                  <span>{myServicesCount || 0} services</span>
                  <span>{decisionStats.passedCount || 0} swapped</span>
                </div>
                {activeConstraintLabels.length > 0 && (
                  <div className="pick-constraint-row">
                    {activeConstraintLabels.slice(0, 6).map(label => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                )}
                <div className="decision-reroll-row" role="group" aria-label="Re-roll with intent">
                  {rerollOptions.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      className="decision-reroll-chip"
                      onClick={() => onRerollCandidate?.(option)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="text-button share-tonight-btn"
                  onClick={onShareTonight}
                >
                  Share tonight card
                </button>
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
                  const feedbackId = decisionFeedback[key];

                  return (
                    <article key={key} className={`pick-between-card ${isLocked ? 'locked' : ''}`}>
                      <Link
                        to={`/${item.media_type || 'movie'}/${item.id}`}
                        state={{ item }}
                        className="pick-between-art"
                        aria-label={`Open ${title} details`}
                      >
                        <MediaImage
                          path={item.backdrop_path || item.poster_path}
                          type={item.backdrop_path ? 'backdrop' : 'poster'}
                          size={item.backdrop_path ? 'w780' : 'w342'}
                          alt=""
                          loading={pick.slot === 'safe' ? 'eager' : 'lazy'}
                        />
                      </Link>
                      <div className="pick-between-card-head">
                        <span className="pick-between-rank">
                          {isLocked ? 'Locked' : pick.slotLabel}
                        </span>
                        <span className="pick-between-confidence">
                          {pick.confidence || 0}% {pick.confidenceLabel || 'match'}
                        </span>
                      </div>
                      <h3>
                        <Link to={`/${item.media_type || 'movie'}/${item.id}`} state={{ item }}>
                          {title}
                        </Link>
                      </h3>
                      <p>{reason || overview}</p>
                      {pick.debateLine && <p className="pick-debate-line">{pick.debateLine}</p>}
                      {pick.tags?.length > 0 && (
                        <div className="pick-tag-row">
                          {pick.tags.map(tag => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="pick-between-meta">
                        {year && <span>{year}</span>}
                        {rating && <span>{rating} TMDB</span>}
                        <span>{item.media_type === 'tv' ? 'Series' : 'Film'}</span>
                      </div>
                      <div
                        className="not-tonight-row"
                        role="group"
                        aria-label={`Why not ${title}?`}
                      >
                        {decisionFeedbackOptions.map(option => (
                          <button
                            key={option.id}
                            type="button"
                            className={`not-tonight-chip ${feedbackId === option.id ? 'active' : ''}`}
                            onClick={() => onFeedbackCandidate?.(item, option)}
                          >
                            {option.label}
                          </button>
                        ))}
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
