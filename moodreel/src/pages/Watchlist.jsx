import React, { useState, useCallback, useMemo, useEffect, useRef, useDeferredValue } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWatchlist } from '../hooks/useWatchlist';
import MovieCard from '../components/MovieCard';
import MediaImage from '../components/MediaImage';
import { SkeletonGrid } from '../components/Skeleton';
import SpinWheel from '../components/SpinWheel';
import EmptyState from '../components/EmptyState';
import searchService from '../services/searchService';
import { shouldSkipLog } from '../services/apiErrorUtils';
import { copyToClipboard, encodeSharePayload } from '../utils/clipboard';
import { getDisplayTitle, getReleaseYear } from '../utils/mediaUtils';

/**
 * Watchlist page with export/import, notes, watched tracking, random picker, matchmaker
 */

function formatRecencyLabel(watchlist = []) {
  const latest = watchlist.reduce((best, item) => {
    const at = Number(item.addedAt);
    return Number.isFinite(at) && at > best ? at : best;
  }, 0);

  if (!latest) return 'No saved items yet';

  const ageMs = Date.now() - latest;
  if (ageMs < 60 * 60 * 1000) return 'Last save: under 1 hour ago';
  if (ageMs < 24 * 60 * 60 * 1000) {
    return `Last save: ${Math.floor(ageMs / (60 * 60 * 1000))}h ago`;
  }
  const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
  return `Last save: ${days}d ago`;
}

function getWatchlistLane(item, isWatchedItem, isFavoriteItem) {
  const rating = item.vote_average || 0;
  const genres = item.genre_ids || [];
  if (isWatchedItem) return 'watched';
  if (isFavoriteItem) return 'tonight';
  if (genres.some(id => [35, 12, 28, 16, 10751].includes(id))) return 'with-friends';
  if (genres.some(id => [18, 10749, 10402].includes(id))) return 'comfort';
  if (rating >= 7.4 || genres.some(id => [99, 9648, 878].includes(id))) return 'deep-focus';
  return 'weekend';
}

function Watchlist() {
  const {
    watchlist,
    favorites,
    toggleWatchlist,
    isInWatchlist,
    isFavorite,
    toggleFavorite,
    getNote,
    setNote,
    getRandomMovie,
    isWatched,
    toggleWatched,
    getWatchedCount,
    exportData,
    importData,
  } = useWatchlist();
  const [activeTab, setActiveTab] = useState('watchlist'); // 'watchlist' | 'favorites'
  const [exportStatus, setExportStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [randomPick, setRandomPick] = useState(null);
  const [showMatchmaker, setShowMatchmaker] = useState(false);
  const [matchInput, setMatchInput] = useState('');
  const [matchResults, setMatchResults] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState('');
  const [recsBasedOn, setRecsBasedOn] = useState(null);
  const [showWatched, setShowWatched] = useState('all'); // 'all' | 'watched' | 'unwatched'
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'rating' | 'title' | 'watched'
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' | 'rows'
  const [activeLane, setActiveLane] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [showMoreActions, setShowMoreActions] = useState(false);
  const moreActionsRef = useRef(null);
  const fileInputRef = useRef(null);
  const randomPickTimerRef = useRef(null);
  const navigate = useNavigate();
  const hasSavedItems = watchlist.length > 0 || favorites.length > 0;

  // Sort and filter watchlist
  const sortedList = useMemo(() => {
    const sourceList = activeTab === 'favorites' ? favorites : watchlist;
    let list = [...sourceList];

    // Apply search filter
    if (deferredSearchTerm.trim()) {
      const query = deferredSearchTerm.toLowerCase().trim();
      list = list.filter(m => (m.title || '').toLowerCase().includes(query));
    }

    if (activeLane !== 'all') {
      list = list.filter(
        item =>
          activeLane ===
          getWatchlistLane(
            item,
            isWatched(item.id, item.media_type),
            isFavorite(item.id, item.media_type)
          )
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        list.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        break;
      case 'title':
        list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'watched':
        list.sort((a, b) => {
          const aWatched = isWatched(a.id, a.media_type) ? 1 : 0;
          const bWatched = isWatched(b.id, b.media_type) ? 1 : 0;
          return bWatched - aWatched;
        });
        break;
      case 'date':
      default:
        list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    }

    // Apply filter (only for watchlist tab really, but harmless for favorites)
    if (showWatched === 'watched') {
      list = list.filter(m => isWatched(m.id, m.media_type));
    } else if (showWatched === 'unwatched') {
      list = list.filter(m => !isWatched(m.id, m.media_type));
    }
    return list;
  }, [
    watchlist,
    favorites,
    activeTab,
    showWatched,
    isWatched,
    isFavorite,
    activeLane,
    sortBy,
    deferredSearchTerm,
  ]);

  const watchedCount = useMemo(() => getWatchedCount(), [getWatchedCount]);

  const maybeTonightItems = useMemo(() => {
    return watchlist
      .filter(item => !isWatched(item.id, item.media_type))
      .sort((a, b) => {
        const ratingDelta = (b.vote_average || 0) - (a.vote_average || 0);
        if (ratingDelta !== 0) return ratingDelta;
        return (b.addedAt || 0) - (a.addedAt || 0);
      })
      .slice(0, 3);
  }, [isWatched, watchlist]);

  const watchlistFreshness = useMemo(() => formatRecencyLabel(watchlist), [watchlist]);
  const libraryStats = useMemo(
    () => [
      { label: 'Saved', value: watchlist.length },
      { label: 'Watched', value: watchedCount },
      { label: 'Favorites', value: favorites.length },
      { label: 'Tonight-ready', value: maybeTonightItems.length },
    ],
    [favorites.length, maybeTonightItems.length, watchedCount, watchlist.length]
  );
  const laneStats = useMemo(() => {
    const lanes = [
      { id: 'all', label: 'All' },
      { id: 'tonight', label: 'Tonight' },
      { id: 'weekend', label: 'Weekend' },
      { id: 'with-friends', label: 'With friends' },
      { id: 'comfort', label: 'Comfort' },
      { id: 'deep-focus', label: 'Deep focus' },
    ];
    return lanes.map(lane => ({
      ...lane,
      count:
        lane.id === 'all'
          ? watchlist.length
          : watchlist.filter(
              item =>
                lane.id ===
                getWatchlistLane(
                  item,
                  isWatched(item.id, item.media_type),
                  isFavorite(item.id, item.media_type)
                )
            ).length,
    }));
  }, [isFavorite, isWatched, watchlist]);

  // Import from JSON file
  const handleImportFile = useCallback(
    e => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = event => {
        const success = importData(event.target.result);
        if (success) {
          setImportStatus('Imported!');
        } else {
          setImportStatus('Failed');
        }
        setTimeout(() => setImportStatus(''), 3000);
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importData]
  );

  // Export watchlist to clipboard
  const handleExport = useCallback(async () => {
    if (sortedList.length === 0) return;

    const exportText = sortedList
      .map(item => {
        const year = item.release_date ? ` (${new Date(item.release_date).getFullYear()})` : '';
        const type = item.media_type === 'tv' ? ' [TV]' : '';
        return `• ${item.title}${year}${type}`;
      })
      .join('\n');

    const fullExport = `🎬 My MoodReel Watchlist\n${'─'.repeat(25)}\n${exportText}\n\nGenerated by MoodReel`;

    try {
      await copyToClipboard(fullExport);
      setExportStatus('Copied!');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (err) {
      setExportStatus('Failed');
      setTimeout(() => setExportStatus(''), 3000);
      console.error('Failed to copy watchlist text:', err);
    }
  }, [sortedList]);

  // Generate shareable link
  const handleShareLink = useCallback(async () => {
    // Create minimal data for sharing (only essential fields)
    const shareData = {
      sharedBy: 'A Friend',
      items: sortedList.slice(0, 20).map(item => ({
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        media_type: item.media_type || 'movie',
      })),
    };

    // Use robust base64 encoding to support Unicode (e.g. movies with accents)
    const encodedData = encodeSharePayload(shareData);

    const shareUrl = `${window.location.origin}/shared?data=${encodedData}`;

    try {
      await copyToClipboard(shareUrl);
      setShareStatus('✓ Copied!');
      setTimeout(() => setShareStatus(''), 3000);
    } catch (err) {
      setShareStatus('Failed');
      setTimeout(() => setShareStatus(''), 3000);
      console.error('Failed to copy share link:', err);
    }
  }, [sortedList]);

  // Random picker
  const handleRandomPick = useCallback(() => {
    if (randomPickTimerRef.current) {
      clearTimeout(randomPickTimerRef.current);
    }
    const movie = getRandomMovie();
    setRandomPick(movie);
  }, [getRandomMovie]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const timer = randomPickTimerRef.current;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    if (!showMoreActions) return;
    const handleClickOutside = e => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target)) {
        setShowMoreActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreActions]);

  // Matchmaker - find movies that appear in pasted friend's list
  const handleMatch = useCallback(() => {
    const friendTitles = matchInput
      .split('\n')
      .map(line =>
        line
          .replace(/^[•\-*]\s*/, '')
          .split('(')[0]
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

    const matches = sortedList.filter(movie => {
      const movieTitle = (movie.title || movie.name || '').toLowerCase();
      return friendTitles.some(title => movieTitle.includes(title) || title.includes(movieTitle));
    });

    setMatchResults({
      count: matches.length,
      movies: matches,
    });
  }, [matchInput, sortedList]);

  // Notes editing
  const startEditNote = useCallback(
    item => {
      setEditingNote({
        id: item.id,
        mediaType: item.media_type || 'movie',
        key: `${item.id}-${item.media_type || 'movie'}`,
      });
      setNoteText(getNote(item.id, item.media_type));
    },
    [getNote]
  );

  const saveNote = useCallback(() => {
    if (editingNote) {
      setNote(editingNote.id, noteText, editingNote.mediaType);
      setEditingNote(null);
      setNoteText('');
    }
  }, [editingNote, noteText, setNote]);

  // Fetch personalized recommendations
  const fetchPersonalizedRecs = useCallback(async () => {
    if (watchlist.length === 0) return;

    setRecsLoading(true);
    setRecsError('');
    const randomMovie = watchlist[Math.floor(Math.random() * watchlist.length)];
    setRecsBasedOn(randomMovie);

    try {
      const mediaType = randomMovie.media_type || 'movie';
      const results = await searchService.fetchSimilar(randomMovie.id, mediaType);

      // Filter out movies already in watchlist
      const filtered = results
        .filter(m => !watchlist.some(w => w.id === m.id && (w.media_type || 'movie') === mediaType))
        .slice(0, 4)
        .map(m => ({ ...m, media_type: mediaType }));

      setPersonalizedRecs(filtered);
    } catch (err) {
      if (!shouldSkipLog(err)) {
        console.error('Error fetching recommendations:', err);
      }
      setRecsError('Could not load recommendations right now.');
      setPersonalizedRecs([]);
    } finally {
      setRecsLoading(false);
    }
  }, [watchlist]);

  // Load personalized recs on mount if watchlist has items
  useEffect(() => {
    if (watchlist.length >= 3 && personalizedRecs.length === 0) {
      fetchPersonalizedRecs();
    }
  }, [watchlist.length, personalizedRecs.length, fetchPersonalizedRecs]);

  const [visibleCount, setVisibleCount] = useState(12);

  // Reset pagination when list changes
  useEffect(() => {
    setVisibleCount(12);
  }, [activeTab, sortBy, showWatched, activeLane, deferredSearchTerm]);

  const visibleItems = useMemo(() => {
    return sortedList.slice(0, visibleCount);
  }, [sortedList, visibleCount]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => prev + 12);
  }, []);

  return (
    <div className={`watchlist-page ${!hasSavedItems ? 'watchlist-page-empty' : ''}`}>
      <div className="watchlist-header">
        <div className="watchlist-header-copy">
          <p className="details-kicker">Library</p>
          <h2 className="page-title">Your Library</h2>
          <p className="page-subtitle">
            Keep the short list clean, sortable, and ready for tonight.
          </p>
          <p className="watchlist-recency">{watchlistFreshness}</p>
          <div className="watchlist-tabs" role="group" aria-label="Watchlist views">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
              aria-pressed={activeTab === 'watchlist'}
              onClick={() => setActiveTab('watchlist')}
            >
              My Watchlist
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
              aria-pressed={activeTab === 'favorites'}
              onClick={() => setActiveTab('favorites')}
            >
              Favorites ❤️
            </button>
          </div>
        </div>
        <div className="watchlist-summary" aria-label="Library summary">
          {libraryStats.map(stat => (
            <div
              key={stat.label}
              className={`watchlist-summary-item ${
                stat.label === 'Tonight-ready' ? 'watchlist-summary-item-ready' : ''
              }`}
            >
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="watchlist-actions">
          {sortedList.length > 1 && (
            <>
              <button
                className="action-btn spin-wheel-btn"
                onClick={() => setShowSpinWheel(true)}
                title="Spin the wheel"
              >
                <span aria-hidden="true">🎡</span> Spin Wheel
              </button>
              <button className="action-btn" onClick={handleRandomPick} title="Pick random movie">
                <span aria-hidden="true">🎲</span> Quick Pick
              </button>
            </>
          )}
          {sortedList.length > 0 && (
            <button className="action-btn" onClick={() => setShowMatchmaker(!showMatchmaker)}>
              <span aria-hidden="true">👥</span> Matchmaker
            </button>
          )}
          <div className="watchlist-more-actions" ref={moreActionsRef}>
            <button
              className="action-btn"
              onClick={() => setShowMoreActions(prev => !prev)}
              aria-expanded={showMoreActions}
              aria-haspopup="menu"
            >
              <span aria-hidden="true">⋯</span> More
            </button>
            {showMoreActions && (
              <div className="watchlist-more-menu" role="menu" aria-label="Library actions">
                {sortedList.length > 0 && (
                  <>
                    <button type="button" role="menuitem" onClick={handleShareLink}>
                      <span aria-hidden="true">🔗</span> {shareStatus || 'Share link'}
                    </button>
                    <button type="button" role="menuitem" onClick={handleExport}>
                      <span aria-hidden="true">📋</span> {exportStatus || 'Copy list'}
                    </button>
                    <button type="button" role="menuitem" onClick={exportData}>
                      <span aria-hidden="true">📥</span> Export JSON
                    </button>
                  </>
                )}
                <button type="button" role="menuitem" onClick={() => fileInputRef.current?.click()}>
                  <span aria-hidden="true">📤</span> {importStatus || 'Import'}
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              aria-label="Import watchlist backup file"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </div>
        </div>
      </div>

      {/* Random Pick Result */}
      {randomPick && (
        <div className="random-pick-banner">
          <Link
            to={`/${randomPick.media_type || 'movie'}/${randomPick.id}`}
            className="random-pick-art"
            aria-label={`Open ${getDisplayTitle(randomPick)} details`}
          >
            {randomPick.poster_path || randomPick.backdrop_path ? (
              <MediaImage
                path={randomPick.poster_path || randomPick.backdrop_path}
                type={randomPick.poster_path ? 'poster' : 'backdrop'}
                size={randomPick.poster_path ? 'w185' : 'w780'}
                alt=""
                loading="eager"
              />
            ) : (
              <span className="pick-icon" aria-hidden="true">
                🎲
              </span>
            )}
          </Link>
          <div className="pick-content">
            <p>Tonight's pick:</p>
            <h3>{getDisplayTitle(randomPick)}</h3>
            <span>
              {[
                getReleaseYear(randomPick),
                (randomPick.media_type || 'movie') === 'tv' ? 'Series' : 'Film',
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
          <div className="random-pick-actions">
            <Link
              to={`/${randomPick.media_type || 'movie'}/${randomPick.id}`}
              className="view-pick-btn"
            >
              View Details
            </Link>
            <button
              type="button"
              className="dismiss-pick-btn"
              onClick={() => setRandomPick(null)}
              aria-label="Dismiss random pick"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {maybeTonightItems.length > 0 && (
        <section className="maybe-tonight-panel" aria-labelledby="maybe-tonight-heading">
          <div className="maybe-tonight-copy">
            <p className="details-kicker">Maybe Tonight</p>
            <h3 id="maybe-tonight-heading">Your saved list, narrowed to a decision.</h3>
            <p>
              MoodReel is treating saved titles as candidates, not clutter. Start with these before
              adding more.
            </p>
          </div>
          <div className="maybe-tonight-grid">
            {maybeTonightItems.map((item, index) => (
              <Link
                key={`${item.id}-${item.media_type || 'movie'}`}
                to={`/${item.media_type || 'movie'}/${item.id}`}
                state={{ item }}
                className="maybe-tonight-card"
              >
                <span>
                  {index === 0 ? 'Best saved bet' : index === 1 ? 'Backup pick' : 'Wildcard'}
                </span>
                <strong>{item.title || item.name}</strong>
                <small>
                  {item.vote_average ? `${item.vote_average.toFixed(1)} TMDB` : 'Saved title'}
                </small>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Watchlist Search */}
      {hasSavedItems && (
        <div className="watchlist-search-wrapper">
          <span className="search-icon-hint">🔍</span>
          <input
            type="search"
            className="watchlist-search-input"
            placeholder="Search your watchlist..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            aria-label="Search watchlist"
          />
          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear watchlist search"
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {hasSavedItems && (
        <div className="watchlist-layout-toggle" role="group" aria-label="Watchlist layout">
          <button
            type="button"
            className={`watchlist-layout-btn ${layoutMode === 'grid' ? 'active' : ''}`}
            onClick={() => setLayoutMode('grid')}
          >
            🖼️ Poster Board
          </button>
          <button
            type="button"
            className={`watchlist-layout-btn ${layoutMode === 'rows' ? 'active' : ''}`}
            onClick={() => setLayoutMode('rows')}
          >
            🎬 Film Log
          </button>
        </div>
      )}

      {activeTab === 'watchlist' && watchlist.length > 0 && (
        <div className="watchlist-lane-filter" role="group" aria-label="Watchlist priority lanes">
          {laneStats.map(lane => (
            <button
              key={lane.id}
              type="button"
              className={activeLane === lane.id ? 'active' : ''}
              aria-pressed={activeLane === lane.id}
              onClick={() => setActiveLane(lane.id)}
            >
              {lane.label} <span>{lane.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Watched Filter */}
      {activeTab === 'watchlist' && watchlist.length > 0 && (
        <div className="watched-filter">
          <span>Show:</span>
          <button
            className={showWatched === 'all' ? 'active' : ''}
            onClick={() => setShowWatched('all')}
          >
            All ({watchlist.length})
          </button>
          <button
            className={showWatched === 'watched' ? 'active' : ''}
            onClick={() => setShowWatched('watched')}
          >
            ✅ Watched ({watchedCount})
          </button>
          <button
            className={showWatched === 'unwatched' ? 'active' : ''}
            onClick={() => setShowWatched('unwatched')}
          >
            👁️ To Watch ({watchlist.length - watchedCount})
          </button>

          <div className="sort-dropdown">
            <label htmlFor="sort-by">Sort:</label>
            <select id="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date">📅 Date Added</option>
              <option value="rating">⭐ Rating</option>
              <option value="title">🔤 Title</option>
              <option value="watched">✅ Watched</option>
            </select>
          </div>
        </div>
      )}

      {/* Personalized Recommendations */}
      {watchlist.length >= 3 && (
        <div className="personalized-recs">
          <div className="recs-header">
            <h3>
              {recsBasedOn ? (
                <>
                  ✨ Because you saved <em>{recsBasedOn.title}</em>
                </>
              ) : (
                <>✨ Recommended for you</>
              )}
            </h3>
            <button
              className="refresh-recs-btn"
              onClick={fetchPersonalizedRecs}
              disabled={recsLoading}
            >
              {recsLoading ? '...' : '🔄 Refresh'}
            </button>
          </div>
          {recsError ? (
            <div className="recs-error">
              <p>{recsError}</p>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={fetchPersonalizedRecs}
                disabled={recsLoading}
              >
                Try again
              </button>
            </div>
          ) : personalizedRecs.length > 0 ? (
            <div className="recs-grid">
              {personalizedRecs.map(movie => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isInWatchlist={isInWatchlist(movie.id, movie.media_type)}
                  onToggleWatchlist={toggleWatchlist}
                  isWatched={isWatched(movie.id, movie.media_type)}
                  onToggleWatched={toggleWatched}
                  mediaType={movie.media_type}
                />
              ))}
            </div>
          ) : recsLoading ? (
            <SkeletonGrid count={4} />
          ) : null}
        </div>
      )}

      {/* Matchmaker Panel */}
      {showMatchmaker && (
        <div className="matchmaker-panel">
          <h4>👥 Movie Matchmaker</h4>
          <p>Paste a friend's exported watchlist to find movies you both want to watch!</p>
          <textarea
            value={matchInput}
            onChange={e => setMatchInput(e.target.value)}
            placeholder="Paste friend's watchlist here..."
            rows={4}
          />
          <button onClick={handleMatch} className="primary-button">
            Find Matches
          </button>

          {matchResults && (
            <div className="match-results">
              {matchResults.count > 0 ? (
                <>
                  <p className="match-success">
                    🎉 Found {matchResults.count} movie{matchResults.count > 1 ? 's' : ''} in
                    common!
                  </p>
                  <div className="match-list">
                    {matchResults.movies.map(m => (
                      <span key={m.id} className="match-chip">
                        {m.title}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="no-matches">No matches found. You have unique taste! 🎬</p>
              )}
            </div>
          )}
        </div>
      )}

      {sortedList.length === 0 ? (
        <EmptyState
          icon={activeTab === 'favorites' ? '💔' : watchlist.length === 0 ? '🎬' : '🔍'}
          title={
            activeTab === 'favorites'
              ? 'No favorites yet'
              : watchlist.length === 0
                ? 'Your watchlist is empty'
                : 'No matches found'
          }
          description={
            activeTab === 'favorites'
              ? 'Mark movies as favorite ❤️ to see them here!'
              : watchlist.length === 0
                ? 'Start adding movies and shows you want to watch!'
                : `We couldn't find any items matching "${searchTerm}" in your watchlist.`
          }
          actionLink="/"
          actionText="Discover Movies"
        >
          <div className="empty-state-steps" aria-label="Watchlist starters">
            {activeTab === 'favorites' ? (
              <>
                <span>Open a detail page</span>
                <span>Tap favorite</span>
                <span>Build a favorites lane</span>
              </>
            ) : watchlist.length === 0 ? (
              <>
                <span>Search a mood</span>
                <span>Save 3 options</span>
                <span>Use Quick Pick tonight</span>
              </>
            ) : (
              <>
                <span>Clear search</span>
                <span>Show all</span>
                <span>Try another sort</span>
              </>
            )}
          </div>
        </EmptyState>
      ) : (
        <>
          <p className="watchlist-count">
            Showing {visibleItems.length} of {sortedList.length} saved
          </p>
          <div className={`watchlist-grid ${layoutMode === 'rows' ? 'watchlist-grid-rows' : ''}`}>
            {visibleItems.map(item => {
              const note = getNote(item.id, item.media_type);
              const noteKey = `${item.id}-${item.media_type || 'movie'}`;
              return (
                <div
                  key={`${item.id}-${item.media_type || 'movie'}`}
                  className={`watchlist-item ${layoutMode === 'rows' ? 'watchlist-item-row' : ''}`}
                >
                  <div className="watchlist-lane-chip">
                    {getWatchlistLane(
                      item,
                      isWatched(item.id, item.media_type),
                      isFavorite(item.id, item.media_type)
                    )
                      .replace('-', ' ')
                      .replace(/\b\w/g, letter => letter.toUpperCase())}
                  </div>
                  <MovieCard
                    movie={item}
                    displayMode={layoutMode === 'rows' ? 'row' : 'poster'}
                    isInWatchlist={isInWatchlist(item.id, item.media_type)}
                    onToggleWatchlist={toggleWatchlist}
                    isFavorite={isFavorite(item.id, item.media_type)}
                    onToggleFavorite={toggleFavorite}
                    isWatched={isWatched(item.id, item.media_type)}
                    onToggleWatched={toggleWatched}
                    mediaType={item.media_type}
                  />

                  {/* Note section */}
                  <div className="movie-note">
                    {editingNote?.key === noteKey ? (
                      <div className="note-editor">
                        <textarea
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          placeholder="Add a note..."
                          rows={2}
                        />
                        <div className="note-actions">
                          <button type="button" onClick={saveNote}>
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingNote(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : note ? (
                      <div className="note-display" onClick={() => startEditNote(item)}>
                        📝 {note}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="add-note-btn"
                        onClick={() => startEditNote(item)}
                      >
                        + Add note
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {visibleCount < sortedList.length && (
            <div className="load-more-container" style={{ textAlign: 'center', margin: '2rem 0' }}>
              <button className="primary-button" onClick={handleLoadMore}>
                Load More
              </button>
            </div>
          )}
        </>
      )}

      <Link to="/stats" className="stats-link">
        📊 View Your Stats →
      </Link>

      {/* Spin the Wheel Modal */}
      {showSpinWheel && (
        <SpinWheel
          movies={sortedList.filter(m => !isWatched(m.id, m.media_type))}
          onSelect={movie => {
            navigate(`/${movie.media_type || 'movie'}/${movie.id}`);
          }}
          onClose={() => setShowSpinWheel(false)}
        />
      )}
    </div>
  );
}

export default Watchlist;
