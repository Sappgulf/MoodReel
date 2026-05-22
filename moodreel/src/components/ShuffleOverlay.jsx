import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import MediaImage from './MediaImage';
import { getDisplayTitle, getReleaseYear } from '../utils/mediaUtils';
import './ShuffleOverlay.css';

function getArtworkSources(item, posterSize = 'w500', backdropSize = 'w780') {
  return [
    item?.poster_path ? { path: item.poster_path, type: 'poster', size: posterSize } : null,
    item?.backdrop_path ? { path: item.backdrop_path, type: 'backdrop', size: backdropSize } : null,
  ].filter(Boolean);
}

function getMediaLabel(item) {
  return (item?.media_type || 'movie') === 'tv' ? 'Series' : 'Film';
}

const ShuffleOverlay = ({
  isActive,
  results = [],
  isWinner = false,
  winnerItem = null,
  onDismiss,
}) => {
  const isVisible = isActive || isWinner;

  useEffect(() => {
    if (!isVisible || !onDismiss) return undefined;

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  const winnerSources = getArtworkSources(winnerItem, 'w500', 'w780');
  const winnerTitle = winnerItem ? getDisplayTitle(winnerItem) : '';
  const winnerYear = winnerItem ? getReleaseYear(winnerItem) : '';
  const winnerRating =
    winnerItem?.vote_average > 0 ? `${Number(winnerItem.vote_average).toFixed(1)} / 10` : '';
  const winnerMeta = [winnerYear, winnerRating, winnerItem ? getMediaLabel(winnerItem) : ''].filter(
    Boolean
  );
  const isBackdropWinner = Boolean(
    isWinner && winnerItem?.backdrop_path && !winnerItem?.poster_path
  );

  const artResults = results.filter(item => item?.poster_path || item?.backdrop_path);
  const shuffleItems =
    artResults.length > 0
      ? [...artResults, ...artResults, ...artResults].slice(0, 12)
      : Array(10).fill({ id: 'dummy', title: 'Loading...' });

  const handleBackdropClick = event => {
    if (event.target === event.currentTarget) {
      onDismiss?.();
    }
  };

  const overlay = (
    <div
      className={`shuffle-overlay page-enter ${isWinner ? 'winner' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={isWinner ? 'Shuffle winner reveal' : 'Shuffle in progress'}
      onClick={handleBackdropClick}
    >
      {isWinner && <div className="cinema-scanlines" />}
      <button
        type="button"
        className="shuffle-dismiss-btn"
        onClick={onDismiss}
        aria-label={isWinner ? 'Dismiss winner reveal' : 'Cancel shuffle'}
      >
        ✕
      </button>
      <div className={`shuffle-container ${isBackdropWinner ? 'backdrop-winner' : ''}`}>
        {isWinner && <div className="winner-pulse" />}
        {isWinner && <div className="winner-shine" />}
        {isWinner && winnerSources.length > 0 && (
          <MediaImage
            sources={winnerSources}
            alt=""
            className="shuffle-backdrop-glow"
            loading="eager"
          />
        )}
        <div className="shuffle-reel" style={isWinner ? { transform: 'translateY(0)' } : {}}>
          {isWinner && winnerItem ? (
            <div
              className={`shuffle-item winner-floating ${
                winnerItem.poster_path ? 'poster-art' : 'backdrop-art'
              }`}
            >
              {winnerSources.length > 0 ? (
                <MediaImage
                  sources={winnerSources}
                  alt={winnerTitle}
                  className="shuffle-poster"
                  loading="eager"
                />
              ) : (
                <div className="shuffle-poster-placeholder" aria-hidden="true" />
              )}
              <div className="shuffle-info">
                <span className="shuffle-label">Tonight's shuffle landed on</span>
                <span className="shuffle-title">{winnerTitle}</span>
                {winnerMeta.length > 0 && (
                  <span className="shuffle-meta">{winnerMeta.join(' · ')}</span>
                )}
              </div>
            </div>
          ) : (
            shuffleItems.map((item, idx) => {
              const itemSources = getArtworkSources(item, 'w342', 'w780');
              return (
                <div
                  key={`${item.id}-${idx}`}
                  className={`shuffle-item ${item.poster_path ? 'poster-art' : 'backdrop-art'}`}
                >
                  {itemSources.length > 0 ? (
                    <MediaImage
                      sources={itemSources}
                      alt=""
                      className="shuffle-poster"
                      loading="lazy"
                    />
                  ) : (
                    <div className="shuffle-poster-placeholder" aria-hidden="true" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      {!isWinner && <div className="shuffle-scanner" />}
      <div className="shuffle-overlay-footer">
        <span className="shuffle-overlay-hint">
          {isWinner
            ? 'Press Escape or dismiss to return to the feed.'
            : 'Press Escape to stop the shuffle.'}
        </span>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return overlay;
  }

  return createPortal(overlay, document.body);
};

export default ShuffleOverlay;
