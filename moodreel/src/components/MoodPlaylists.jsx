import React, { useState, useCallback } from 'react';
import { useCustomPlaylists } from '../hooks/useCustomPlaylists';
import { copyToClipboard } from '../utils/clipboard';
import ConfirmDialog from './ConfirmDialog';

/**
 * Pre-defined mood playlists with curated genre/keyword combinations
 */
const PLAYLISTS = [
  {
    id: 'cozy-sunday',
    name: '☕ Cozy Sunday',
    description: 'Warm, feel-good movies for a relaxing day',
    color: '#F5A623',
    genres: [35, 10751, 10749], // Comedy, Family, Romance
    keywords: 'heartwarming,comfort,cozy',
  },
  {
    id: 'date-night',
    name: '💕 Date Night',
    description: 'Romantic and fun picks for two',
    color: '#E91E63',
    genres: [10749, 35], // Romance, Comedy
    keywords: 'romantic,love,date',
  },
  {
    id: 'mind-benders',
    name: '🧠 Mind-Benders',
    description: 'Twist-filled thrillers that keep you guessing',
    color: '#9C27B0',
    genres: [53, 9648, 878], // Thriller, Mystery, Sci-Fi
    keywords: 'twist,mind-bending,thriller',
  },
  {
    id: 'adrenaline-rush',
    name: '💥 Adrenaline Rush',
    description: 'High-octane action and adventure',
    color: '#F44336',
    genres: [28, 12], // Action, Adventure
    keywords: 'action,adventure,intense',
  },
  {
    id: 'laughs-only',
    name: '😂 Laughs Only',
    description: 'Pure comedy to lift your spirits',
    color: '#4CAF50',
    genres: [35], // Comedy
    keywords: 'funny,hilarious,comedy',
  },
  {
    id: 'spine-tinglers',
    name: '👻 Spine Tinglers',
    description: 'Scary movies for brave souls',
    color: '#37474F',
    genres: [27], // Horror
    keywords: 'scary,horror,creepy',
  },
  {
    id: 'tearjerkers',
    name: '😢 Tearjerkers',
    description: 'Emotional dramas that hit the feels',
    color: '#2196F3',
    genres: [18], // Drama
    keywords: 'emotional,sad,dramatic',
  },
  {
    id: 'family-fun',
    name: '👨‍👩‍👧‍👦 Family Fun',
    description: 'Movies everyone can enjoy together',
    color: '#FF9800',
    genres: [10751, 16], // Family, Animation
    keywords: 'family,kids,animated',
  },
];

/**
 * MoodPlaylists - Curated and custom movie collections
 */
function MoodPlaylists({ onSelectPlaylist }) {
  const { playlists, deletePlaylist, updatePlaylist, movePlaylist } = useCustomPlaylists();
  const [hoveredId, setHoveredId] = useState(null);
  const [showAllPlaylists, setShowAllPlaylists] = useState(false);
  const [playlistQuery, setPlaylistQuery] = useState('');

  const handleSelect = useCallback(
    (playlist, isCustom = false) => {
      if (isCustom) {
        onSelectPlaylist({
          name: playlist.name,
          customFilters: playlist.filters,
        });
      } else {
        onSelectPlaylist({
          genres: playlist.genres,
          keywords: playlist.keywords,
          name: playlist.name,
        });
      }
    },
    [onSelectPlaylist]
  );

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = useCallback(() => {
    if (confirmDeleteId) deletePlaylist(confirmDeleteId);
    setConfirmDeleteId(null);
  }, [confirmDeleteId, deletePlaylist]);

  const handleRename = (e, playlist) => {
    e.stopPropagation();
    setRenameTarget(playlist);
    setRenameValue(playlist.rawName || playlist.name);
  };

  const confirmRename = useCallback(
    name => {
      const trimmed = typeof name === 'string' ? name.trim() : '';
      if (!trimmed || !renameTarget) {
        setRenameTarget(null);
        return;
      }
      updatePlaylist(renameTarget.originalId, {
        name: trimmed,
        desc: `Custom vibes for ${trimmed}`,
      });
      setRenameTarget(null);
    },
    [renameTarget, updatePlaylist]
  );

  const handleMove = (e, id, direction) => {
    e.stopPropagation();
    movePlaylist(id, direction);
  };

  const handleShare = async (e, playlist) => {
    e.stopPropagation();
    const params = new URLSearchParams();
    const filters = playlist.filters || {};
    if (filters.mood) params.set('mood', filters.mood);
    if (filters.contentType && filters.contentType !== 'all')
      params.set('type', filters.contentType);
    if (filters.selectedProviders?.length)
      params.set('services', filters.selectedProviders.join(','));
    if (filters.minRating) params.set('rating', filters.minRating);
    if (filters.advancedFilters?.yearMin) params.set('yearMin', filters.advancedFilters.yearMin);
    if (filters.advancedFilters?.yearMax) params.set('yearMax', filters.advancedFilters.yearMax);
    const url = `${window.location.origin}${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    try {
      await copyToClipboard(url);
    } catch {
      // Clipboard access can be blocked in non-secure or restricted contexts.
    }
  };

  const allPlaylists = [
    ...PLAYLISTS.map(playlist => ({ ...playlist, isCustom: false })),
    ...playlists.map(playlist => ({
      ...playlist,
      id: `custom-${playlist.id}`,
      originalId: playlist.id,
      rawName: playlist.name,
      name: `✨ ${playlist.name}`,
      description: playlist.desc,
      isCustom: true,
    })),
  ];
  const filteredPlaylists = allPlaylists.filter(playlist => {
    const query = playlistQuery.trim().toLowerCase();
    if (!query) return true;
    return `${playlist.name} ${playlist.description}`.toLowerCase().includes(query);
  });
  const visiblePlaylists = showAllPlaylists ? filteredPlaylists : filteredPlaylists.slice(0, 4);
  const hiddenPlaylistCount = filteredPlaylists.length - visiblePlaylists.length;

  return (
    <div className="mood-playlists-section">
      <h3 className="playlists-title">🎬 Mood Playlists</h3>
      <p className="playlists-subtitle">A few starting points</p>
      <label className="playlist-search-label" htmlFor="playlist-search">
        Search saved vibes
      </label>
      <input
        id="playlist-search"
        className="playlist-search-input"
        type="search"
        value={playlistQuery}
        placeholder="Search playlists"
        onChange={e => setPlaylistQuery(e.target.value)}
      />

      <div className="playlists-grid">
        {visiblePlaylists.map(playlist => (
          <article
            key={playlist.id}
            className={`playlist-card ${hoveredId === playlist.id ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredId(playlist.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              '--playlist-color': playlist.color,
            }}
          >
            <button
              type="button"
              className="playlist-select"
              onClick={() => handleSelect(playlist, playlist.isCustom)}
            >
              <span className="playlist-name">{playlist.name}</span>
              <span className="playlist-desc">{playlist.description}</span>
            </button>
            {playlist.isCustom && (
              <span className="playlist-actions" aria-label={`${playlist.rawName} actions`}>
                <button
                  type="button"
                  className="playlist-action"
                  aria-label={`Move ${playlist.rawName} up`}
                  onClick={e => handleMove(e, playlist.originalId, 'up')}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="playlist-action"
                  aria-label={`Move ${playlist.rawName} down`}
                  onClick={e => handleMove(e, playlist.originalId, 'down')}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="playlist-action"
                  aria-label={`Rename ${playlist.rawName}`}
                  onClick={e => handleRename(e, playlist)}
                  title="Rename vibe"
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="playlist-action"
                  aria-label={`Copy link for ${playlist.rawName}`}
                  onClick={e => handleShare(e, playlist)}
                  title="Copy vibe link"
                >
                  ↗
                </button>
                <button
                  type="button"
                  className="playlist-action delete-playlist"
                  aria-label={`Delete ${playlist.rawName}`}
                  onClick={e => handleDelete(e, playlist.originalId)}
                  title="Delete vibe"
                >
                  ✕
                </button>
              </span>
            )}
          </article>
        ))}
      </div>

      {hiddenPlaylistCount > 0 && (
        <button
          type="button"
          className="show-more-btn"
          onClick={() => setShowAllPlaylists(prev => !prev)}
          aria-expanded={showAllPlaylists}
        >
          {showAllPlaylists
            ? '▲ Show fewer playlists'
            : `▼ Show ${hiddenPlaylistCount} more playlists`}
        </button>
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        mode="confirm"
        title="Delete this custom vibe?"
        message="This will remove the saved vibe permanently."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <ConfirmDialog
        isOpen={!!renameTarget}
        mode="prompt"
        title="Rename saved vibe"
        confirmLabel="Rename"
        initialValue={renameValue}
        placeholder="Vibe name"
        onConfirm={confirmRename}
        onCancel={() => setRenameTarget(null)}
      />
    </div>
  );
}

export default React.memo(MoodPlaylists);
