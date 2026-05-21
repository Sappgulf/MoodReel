import React from 'react';

/**
 * Full-screen offline fallback when the app cannot reach the network.
 */
export default function OfflineScreen({ onRetry }) {
  const handleRetry = () => {
    if (typeof onRetry === 'function') {
      onRetry();
      return;
    }
    if (typeof window !== 'undefined') window.location.reload();
  };

  return (
    <div
      className="offline-screen"
      role="alertdialog"
      aria-labelledby="offline-title"
      aria-modal="false"
    >
      <div className="offline-screen-card">
        <p className="offline-screen-icon" aria-hidden="true">
          📡
        </p>
        <h2 id="offline-title">You&apos;re offline</h2>
        <p>
          MoodReel can still show cached pages and saved lists. Live search and fresh
          recommendations need a connection.
        </p>
        <ul className="offline-screen-tips">
          <li>Browse your watchlist and profile while offline.</li>
          <li>Previously viewed pages may load from cache.</li>
          <li>Reconnect to refresh moods and TMDB results.</li>
        </ul>
        <button type="button" className="primary-button" onClick={handleRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}
