import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPosterUrl } from '../utils/mediaUtils';
import './ShuffleOverlay.css';

const ShuffleOverlay = ({
  isActive,
  isLocked = false,
  currentPick = null,
  shuffleCount = 0,
  results = [],
  onStop,
  onShuffleAgain,
  onDismiss,
  onOpenSpinWheel,
}) => {
  const isVisible = isActive || isLocked;

  useEffect(() => {
    if (!isVisible || !onDismiss) return undefined;

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (isActive && onStop) {
          onStop();
        } else {
          onDismiss();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onDismiss, onOpenSpinWheel, isActive, onStop]);

  if (!isVisible) return null;

  const shuffleItems =
    results.length > 0
      ? [...results, ...results].slice(0, 10)
      : Array(10).fill({ id: 'dummy', title: 'Loading...' });

  const title = currentPick ? currentPick.title || currentPick.name : 'Scanning…';

  const handleBackdropClick = event => {
    if (event.target === event.currentTarget && isActive && onStop) {
      onStop();
    }
  };

  return (
    <div
      className={`shuffle-overlay page-enter ${isLocked ? 'winner' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={isLocked ? 'Your pick' : 'Shuffle in progress'}
      onClick={handleBackdropClick}
    >
      {isLocked && <div className="cinema-scanlines" />}
      <button
        type="button"
        className="shuffle-dismiss-btn"
        onClick={isActive ? onStop : onDismiss}
        aria-label={isActive ? 'Stop shuffle' : 'Close'}
      >
        ✕
      </button>
      <div className="shuffle-container">
        {isLocked && <div className="winner-pulse" />}
        {isLocked && <div className="winner-shine" />}
        <div className="shuffle-reel" style={isLocked ? { transform: 'translateY(0)' } : {}}>
          {isLocked && currentPick ? (
            <div className="shuffle-item winner-floating">
              <img
                src={getPosterUrl(currentPick.poster_path)}
                alt={`${title} poster`}
                className="shuffle-poster"
                loading="lazy"
                decoding="async"
              />
              <div className="shuffle-info">
                <span className="shuffle-pick-label">Your pick</span>
                <span className="shuffle-title">{title}</span>
              </div>
            </div>
          ) : currentPick ? (
            <div className="shuffle-item shuffle-item--live">
              <img
                src={getPosterUrl(currentPick.poster_path)}
                alt=""
                className="shuffle-poster"
                loading="lazy"
                decoding="async"
              />
              <div className="shuffle-info">
                <span className="shuffle-title">{title}</span>
              </div>
            </div>
          ) : (
            shuffleItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="shuffle-item">
                {item.poster_path ? (
                  <img
                    src={getPosterUrl(item.poster_path, 'w185')}
                    alt=""
                    className="shuffle-poster"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="shuffle-poster-placeholder" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {!isLocked && <div className="shuffle-scanner" />}
      <div className="shuffle-overlay-footer">
        {isActive && (
          <>
            <p className="shuffle-overlay-hint">
              Pick #{shuffleCount || 0} — new titles every few seconds using your mood & filters.
            </p>
            <button type="button" className="primary-button shuffle-stop-btn" onClick={onStop}>
              Stop & lock this pick
            </button>
          </>
        )}
        {isLocked && currentPick && (
          <div className="shuffle-winner-actions">
            <Link
              to={`/${currentPick.media_type || 'movie'}/${currentPick.id}`}
              className="primary-button"
              onClick={e => e.stopPropagation()}
            >
              Watch now
            </Link>
            <button type="button" className="secondary-button" onClick={onShuffleAgain}>
              Keep shuffling
            </button>
            {onOpenSpinWheel && (
              <button type="button" className="secondary-button" onClick={onOpenSpinWheel}>
                Spin the wheel
              </button>
            )}
            <button type="button" className="text-button" onClick={onDismiss}>
              Close
            </button>
          </div>
        )}
        {isLocked && <span className="shuffle-overlay-hint">Press Escape to close.</span>}
      </div>
    </div>
  );
};

export default ShuffleOverlay;
