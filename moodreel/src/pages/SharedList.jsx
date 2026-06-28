import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { useWatchlist } from '../hooks/useWatchlist';
import { decodeSharePayload } from '../utils/clipboard';

/**
 * Shared Watchlist or Vibe View
 * - Watchlist shares (legacy): list of saved items
 * - Vibe shares: encoded filter set, immediately redirects to /
 *   after capturing the filters in sessionStorage so Home can apply them
 */
function SharedList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sharedItems, setSharedItems] = useState([]);
  const [sharedBy, setSharedBy] = useState('');
  const [error, setError] = useState('');
  const [vibeApplied, setVibeApplied] = useState(false);
  const { isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useWatchlist();

  useEffect(() => {
    const data = searchParams.get('data');
    if (!data) {
      setError('No shared list found in URL');
      return;
    }

    let decoded;
    try {
      decoded = decodeSharePayload(data);
    } catch (e) {
      console.error('Error parsing shared payload:', e);
      setError('Could not decode shared list');
      return;
    }

    if (decoded && decoded.type === 'vibe' && decoded.filters) {
      try {
        sessionStorage.setItem('moodreel:shared-vibe', JSON.stringify(decoded));
      } catch (err) {
        console.warn('Could not persist shared vibe', err);
      }
      if (!vibeApplied) {
        setVibeApplied(true);
        navigate('/', { replace: true });
      }
      return;
    }

    if (decoded && decoded.items && Array.isArray(decoded.items)) {
      setSharedItems(decoded.items);
      setSharedBy(decoded.sharedBy || 'A friend');
    } else {
      setError('Invalid list format');
    }
  }, [searchParams, navigate, vibeApplied]);

  if (error) {
    return (
      <div className="shared-list-page">
        <div className="shared-error">
          <h2>😕 Oops!</h2>
          <p>{error}</p>
          <Link to="/" className="primary-button">
            Go to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-list-page">
      <Link to="/" className="back-button">
        ← Back to Discover
      </Link>

      <div className="shared-header">
        <h2>🎬 {sharedBy}&apos;s Watchlist</h2>
        <p className="shared-subtitle">
          {sharedItems.length} {sharedItems.length === 1 ? 'title' : 'titles'} shared with you
        </p>
      </div>

      <div className="shared-info-banner">
        <span>💡</span>
        <p>Click the heart on any movie to add it to your own watchlist!</p>
      </div>

      {sharedItems.length > 0 ? (
        <div className="recommendations shared-grid">
          {sharedItems.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isInWatchlist={isInWatchlist(movie.id)}
              onToggleWatchlist={toggleWatchlist}
              isWatched={isWatched(movie.id)}
              onToggleWatched={toggleWatched}
              mediaType={movie.media_type || 'movie'}
            />
          ))}
        </div>
      ) : (
        <p className="loading-text">Loading shared list...</p>
      )}
    </div>
  );
}

export default SharedList;
