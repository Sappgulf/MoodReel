import React, { useEffect, useMemo } from 'react';
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
function updateVibeOgMeta(decoded) {
  if (typeof document === 'undefined') return;
  const title = decoded?.name || 'A MoodReel vibe';
  const mood = decoded?.filters?.mood || '';
  const description = mood
    ? `A "${mood}" vibe curated on MoodReel. Tap to discover the picks.`
    : 'A curated vibe on MoodReel. Tap to discover the picks.';
  const params = new URLSearchParams();
  params.set('title', title);
  if (mood) params.set('mood', String(mood).slice(0, 32));
  const genres = Array.isArray(decoded?.filters?.selectedGenres)
    ? decoded.filters.selectedGenres
    : [];
  if (genres.length) params.set('genres', genres.join(','));
  const moodEmoji = emojiForMood(mood);
  params.set('emoji', moodEmoji);
  const ogImage = `${window.location.origin}/api/og-vibe?${params.toString()}`;

  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:image"]', ogImage);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  setMeta('meta[name="twitter:image"]', ogImage);
}

function setMeta(selector, content) {
  const el = document.head.querySelector(selector);
  if (!el) return;
  el.setAttribute('content', content);
}

function emojiForMood(mood) {
  if (!mood || typeof mood !== 'string') return '🎬';
  const n = mood.toLowerCase();
  if (/happy|joy|fun|comedy|laugh|uplift/.test(n)) return '😄';
  if (/sad|drama|emotion|tear|cry/.test(n)) return '😢';
  if (/scary|horror|thriller|creep|dark/.test(n)) return '😱';
  if (/romance|love|date|romantic/.test(n)) return '💕';
  if (/sci-?fi|space|future/.test(n)) return '🚀';
  if (/action|fight|adrenalin|thrill/.test(n)) return '⚔️';
  if (/fantasy|magic|wizard/.test(n)) return '🧙';
  if (/mystery|whodunit/.test(n)) return '🔍';
  if (/family|kid/.test(n)) return '👨‍👩‍👧';
  if (/cozy|comfy|warm|comfort/.test(n)) return '☕';
  if (/documentary/.test(n)) return '📚';
  if (/noir|crime/.test(n)) return '🕵️';
  return '🎬';
}

function SharedList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useWatchlist();

  // The shared payload lives entirely in the URL, so decode it during render
  // instead of copying it into state from an effect.
  const shared = useMemo(() => {
    const data = searchParams.get('data');
    if (!data) return { error: 'No shared list found in URL' };

    let decoded;
    try {
      decoded = decodeSharePayload(data);
    } catch (e) {
      console.error('Error parsing shared payload:', e);
      return { error: 'Could not decode shared list' };
    }

    if (decoded && decoded.type === 'vibe' && decoded.filters) {
      return { vibe: decoded };
    }

    if (decoded && Array.isArray(decoded.items)) {
      return { items: decoded.items, sharedBy: decoded.sharedBy || 'A friend' };
    }

    return { error: 'Invalid list format' };
  }, [searchParams]);

  const { error = '', items: sharedItems = [], sharedBy = '', vibe } = shared;

  // A shared vibe is handed to Discover rather than rendered here.
  useEffect(() => {
    if (!vibe) return;
    // Briefly surface the shared vibe via <meta> tags so social link previews
    // show the right title + image before the redirect.
    updateVibeOgMeta(vibe);
    try {
      sessionStorage.setItem('moodreel:shared-vibe', JSON.stringify(vibe));
    } catch (err) {
      console.warn('Could not persist shared vibe', err);
    }
    navigate('/', { replace: true });
  }, [navigate, vibe]);

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
          {sharedItems.map(movie => {
            const mediaType = movie.media_type || 'movie';
            return (
              <MovieCard
                key={`${movie.id}-${mediaType}`}
                movie={{ ...movie, media_type: mediaType }}
                isInWatchlist={isInWatchlist(movie.id, mediaType)}
                onToggleWatchlist={toggleWatchlist}
                isWatched={isWatched(movie.id, mediaType)}
                onToggleWatched={toggleWatched}
                mediaType={mediaType}
              />
            );
          })}
        </div>
      ) : (
        <p className="loading-text">Loading shared list...</p>
      )}
    </div>
  );
}

export default SharedList;
