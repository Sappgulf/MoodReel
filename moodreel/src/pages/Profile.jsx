import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAchievements } from '../hooks/useAchievements';
import { useWatchlist } from '../hooks/useWatchlist';
import { useMoodHistory } from '../hooks/useMoodHistory';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useProviderSettings } from '../hooks/useProviderSettings';
import { useTasteProfile } from '../hooks/useTasteProfile';
import { useToasts } from '../context/ToastContext';
import { clearUserApiKey, getApiKeyStatus, saveUserApiKey } from '../services/apiClient';
import { calculatePersona } from '../utils/personaUtils';
import { copyToClipboard } from '../utils/clipboard';
import { GENRE_MAP } from '../utils/mediaUtils';
import { clearMoodReelData, downloadPrivacyExport, importPrivacyData } from '../utils/privacyData';
import ConfirmDialog from '../components/ConfirmDialog';
import { safeGetJSON, safeSetJSON } from '../storage/safeStorage';

const AVATARS = ['🎬', '🍿', '⭐', '🎭', '🎥', '🎞️', '🎟️', '📺', '🎧', '🎮', '💡', '✨'];

const REGIONS = [
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'AU', label: 'Australia' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'JP', label: 'Japan' },
  { code: 'BR', label: 'Brazil' },
];

const STREAMING_SERVICE_PRESETS = [
  { id: 8, label: 'Netflix' },
  { id: 9, label: 'Prime' },
  { id: 337, label: 'Disney+' },
  { id: 15, label: 'Hulu' },
  { id: 1899, label: 'Max' },
  { id: 350, label: 'Apple TV+' },
  { id: 386, label: 'Peacock' },
  { id: 531, label: 'Paramount+' },
];

const TASTE_SETTINGS_KEY = 'moodreel-taste-settings';
const DEFAULT_TASTE_SETTINGS = {
  contentType: 'any',
  maxRuntime: 0,
  avoidHorror: false,
  hiddenGemBias: false,
  preferredDecades: [],
};

const DECADE_OPTIONS = [1970, 1980, 1990, 2000, 2010, 2020];

function Profile() {
  const { profile, updateProfile } = useUserProfile();
  const { exp, level, progressToNextLevel, achievements } = useAchievements();
  const { watchlist } = useWatchlist();
  const { history: moodHistory } = useMoodHistory();
  const { history: watchHistory } = useWatchHistory();
  const { region, setRegion, myServices, toggleService, resetServices } = useProviderSettings();
  const { resetProfile, tasteCounts } = useTasteProfile();
  const { pushToast } = useToasts();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(profile);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [tasteSettings, setTasteSettings] = useState(() =>
    safeGetJSON(TASTE_SETTINGS_KEY, DEFAULT_TASTE_SETTINGS)
  );
  const importInputRef = useRef(null);
  const [apiKeyStatus, setApiKeyStatus] = useState(() => getApiKeyStatus());
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    const status = getApiKeyStatus();
    return status.source === 'user' ? status.value || '' : '';
  });

  const stats = useMemo(() => {
    const genreCounts = {};
    watchlist.forEach(movie => {
      (movie.genre_ids || []).forEach(gid => {
        const name = GENRE_MAP[gid] || 'Other';
        genreCounts[name] = (genreCounts[name] || 0) + 1;
      });
    });
    const genreData = Object.entries(genreCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalMovies: watchHistory.length,
      genreData,
    };
  }, [watchlist, watchHistory]);

  const persona = useMemo(() => calculatePersona(stats), [stats]);
  const safeLevelProgress = Math.max(0, Math.min(100, Number(progressToNextLevel) || 0));
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const topGenreNames = stats.genreData.slice(0, 3).map(genre => genre.name);

  useEffect(() => {
    safeSetJSON(TASTE_SETTINGS_KEY, tasteSettings);
  }, [tasteSettings]);

  const handleSave = () => {
    updateProfile(editForm);
    setIsEditing(false);
  };

  const updateTasteSetting = (key, value) => {
    setTasteSettings(prev => ({ ...prev, [key]: value }));
  };

  const togglePreferredDecade = decade => {
    setTasteSettings(prev => {
      const preferredDecades = prev.preferredDecades || [];
      return {
        ...prev,
        preferredDecades: preferredDecades.includes(decade)
          ? preferredDecades.filter(item => item !== decade)
          : [...preferredDecades, decade],
      };
    });
  };

  const handleExportData = () => {
    const didStart = downloadPrivacyExport();
    pushToast({
      icon: didStart ? '⬇️' : '⚠️',
      title: didStart ? 'Data export ready' : 'Export unavailable',
      message: didStart
        ? 'Your MoodReel backup includes local profile, taste, vibes, ratings, and watch data.'
        : 'This browser blocked the download flow.',
      variant: didStart ? 'info' : 'error',
      duration: 4000,
    });
  };

  const handleImportFile = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedCount = importPrivacyData(await file.text());
      pushToast({
        icon: '⬆️',
        title: 'Data imported',
        message: `${importedCount} MoodReel data sections restored. Reloading to apply them.`,
        duration: 3500,
      });
      window.setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      pushToast({
        icon: '⚠️',
        title: 'Import failed',
        message: error.message || 'Choose a MoodReel export file and try again.',
        variant: 'error',
        duration: 5000,
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleResetLocalData = () => {
    setShowResetConfirm(true);
  };

  const confirmResetLocalData = () => {
    setShowResetConfirm(false);
    clearMoodReelData();
    pushToast({
      icon: '🧹',
      title: 'Local data reset',
      message: 'MoodReel will reload with a clean local profile.',
      duration: 3000,
    });
    window.setTimeout(() => window.location.reload(), 600);
  };

  const apiKeySourceLabel = useMemo(() => {
    if (!apiKeyStatus.configured) return 'Not set';
    if (apiKeyStatus.source === 'environment') return 'Environment variable';
    if (apiKeyStatus.source === 'bootstrap') return 'Bootstrap config';
    return 'Stored locally';
  }, [apiKeyStatus]);

  const isApiKeyEditable = apiKeyStatus.source === 'user' || !apiKeyStatus.configured;

  const apiKeyStatusMessage = useMemo(() => {
    if (apiKeyStatus.configured) {
      return `TMDB API key source: ${apiKeySourceLabel}.`;
    }
    return 'TMDB API key is not configured yet.';
  }, [apiKeyStatus, apiKeySourceLabel]);

  const handleSaveApiKey = () => {
    const previouslyUserStored = apiKeyStatus.source === 'user';
    const hadInput = apiKeyInput.trim().length > 0;
    const saved = saveUserApiKey(apiKeyInput);
    const status = getApiKeyStatus();
    setApiKeyStatus(status);
    setApiKeyInput(status.source === 'user' ? status.value || '' : '');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('moodreel:api-key-updated'));
    }

    if (!saved && apiKeyInput.trim()) {
      pushToast({
        icon: '⚠️',
        title: 'Key save blocked',
        message:
          'Browser storage blocked this save. Use console-only override only when storage is unavailable.',
        variant: 'error',
        duration: 4500,
      });
      return;
    }

    if (!hadInput && previouslyUserStored && !status.configured) {
      pushToast({
        icon: '🧹',
        title: 'API key cleared',
        message: 'Your local TMDB key preference was removed.',
        variant: 'info',
        duration: 3200,
      });
      return;
    }

    if (!hadInput && !previouslyUserStored) {
      pushToast({
        icon: '⚠️',
        title: 'No key entered',
        message: 'Enter a TMDB key to store it locally.',
        variant: 'error',
        duration: 2800,
      });
      return;
    }

    pushToast({
      icon: '🔐',
      title: 'API key updated',
      message: saved
        ? 'TMDB key saved in local browser storage.'
        : 'Use the input to update your local TMDB key.',
      variant: saved ? 'info' : 'error',
      duration: 3200,
    });
  };

  const handleClearApiKey = () => {
    clearUserApiKey();
    setApiKeyInput('');
    setApiKeyStatus(getApiKeyStatus());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('moodreel:api-key-updated'));
    }
    pushToast({
      icon: '🧹',
      title: 'API key removed',
      message: 'Your local TMDB key preference was cleared.',
      duration: 3000,
    });
  };

  return (
    <div className="profile-page penthouse-container">
      <div className="profile-hero glass-card">
        <div className="profile-header">
          <div className="avatar-container big-avatar">
            <span className="avatar-emoji">{profile.avatar}</span>
            {isEditing && (
              <div className="avatar-picker glass-card">
                {AVATARS.map(a => (
                  <button
                    key={a}
                    className={editForm.avatar === a ? 'active' : ''}
                    onClick={() => setEditForm(prev => ({ ...prev, avatar: a }))}
                    aria-label={`Select avatar ${a}`}
                    aria-pressed={editForm.avatar === a}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="profile-info">
            {isEditing ? (
              <input
                className="edit-username-input"
                value={editForm.username}
                onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                aria-label="Username"
              />
            ) : (
              <h1>{profile.username}</h1>
            )}
            <p className="join-date">
              Member since {new Date(profile.joinDate).toLocaleDateString()}
            </p>
            <div className="level-badge">Level {level}</div>
          </div>
          <div className="profile-quick-stats" aria-label="Profile summary">
            <span>
              <strong>{stats.totalMovies}</strong>
              viewed
            </span>
            <span>
              <strong>{moodHistory.length}</strong>
              moods
            </span>
            <span>
              <strong>{unlockedCount}</strong>
              badges
            </span>
          </div>
          <button
            type="button"
            className="edit-profile-btn"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            {isEditing ? '✅ Save' : '📂 Edit Profile'}
          </button>
        </div>

        <div className="profile-experience">
          <div className="exp-label">
            <span>XP: {exp}</span>
            <span>Next Level: {Math.ceil(progressToNextLevel)}%</span>
          </div>
          <div className="exp-bar-container">
            <div className="exp-bar-fill" style={{ width: `${safeLevelProgress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="persona-card glass-card">
          <h3>🎭 Your Mood Persona</h3>
          <div className="persona-content">
            <span className="persona-emoji">{persona.emoji}</span>
            <div>
              <h4>{persona.title}</h4>
              <p>{persona.description}</p>
            </div>
          </div>
        </div>

        <div className="bio-card glass-card">
          <h3>📝 Bio</h3>
          {isEditing ? (
            <textarea
              value={editForm.bio}
              onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
              aria-label="Bio"
            />
          ) : (
            <p>{profile.bio}</p>
          )}
        </div>

        <div className="stats-preview glass-card">
          <h3>📽️ Discovery Stats</h3>
          <div className="simple-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.totalMovies}</span>
              <span className="stat-label">Watched</span>
            </div>
            <Link to="/achievements" className="stat-item clickable-stat">
              <span className="stat-value">{unlockedCount}</span>
              <span className="stat-label">Badges</span>
            </Link>
            <div className="stat-item">
              <span className="stat-value">{moodHistory.length}</span>
              <span className="stat-label">Moods</span>
            </div>
          </div>
        </div>

        {stats.genreData.length > 0 && (
          <div className="top-genres-card glass-card">
            <h3>🎯 Top Genres</h3>
            <div className="genre-bars">
              {stats.genreData.slice(0, 5).map((genre, i) => (
                <div key={genre.name} className="genre-bar-row">
                  <span className="genre-bar-label">{genre.name}</span>
                  <div className="genre-bar-track">
                    <div
                      className="genre-bar-fill"
                      style={{
                        width: `${(genre.count / stats.genreData[0].count) * 100}%`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  </div>
                  <span className="genre-bar-count">{genre.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="settings-card glass-card">
          <h3>⚙️ Streaming Settings</h3>
          <label htmlFor="region-select">Region</label>
          <select id="region-select" value={region} onChange={e => setRegion(e.target.value)}>
            {REGIONS.map(regionOption => (
              <option key={regionOption.code} value={regionOption.code}>
                {regionOption.label}
              </option>
            ))}
          </select>
          <div className="streaming-setup-block">
            <div className="settings-row-head">
              <h4>Available on my services</h4>
              {myServices.length > 0 && (
                <button type="button" className="text-button" onClick={resetServices}>
                  Clear
                </button>
              )}
            </div>
            <p>Tonight Mode boosts titles that are actually streamable where you already pay.</p>
            <div className="profile-service-grid" role="group" aria-label="Streaming services">
              {STREAMING_SERVICE_PRESETS.map(service => (
                <button
                  key={service.id}
                  type="button"
                  className={`profile-service-chip ${myServices.includes(service.id) ? 'active' : ''}`}
                  aria-pressed={myServices.includes(service.id)}
                  onClick={() => toggleService(service.id)}
                >
                  {service.label}
                </button>
              ))}
            </div>
          </div>
          <div className="taste-profile-summary">
            <h4>🎯 Taste Profile</h4>
            <p>
              Liked: {tasteCounts.liked} • Disliked: {tasteCounts.disliked}
            </p>
            <p>
              MoodReel currently sees:{' '}
              {topGenreNames.length > 0 ? topGenreNames.join(', ') : 'not enough genre signal yet'}.
            </p>
            <div className="taste-editor-grid">
              <label>
                Format
                <select
                  value={tasteSettings.contentType || 'any'}
                  onChange={e => updateTasteSetting('contentType', e.target.value)}
                >
                  <option value="any">Movies and TV</option>
                  <option value="movie">Movies first</option>
                  <option value="tv">Series first</option>
                </select>
              </label>
              <label>
                Max runtime
                <select
                  value={tasteSettings.maxRuntime || 0}
                  onChange={e => updateTasteSetting('maxRuntime', Number(e.target.value))}
                >
                  <option value={0}>No limit</option>
                  <option value={90}>90 minutes</option>
                  <option value={110}>110 minutes</option>
                  <option value={130}>130 minutes</option>
                </select>
              </label>
            </div>
            <div className="preference-toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(tasteSettings.avoidHorror)}
                  onChange={e => updateTasteSetting('avoidHorror', e.target.checked)}
                />
                Avoid horror by default
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(tasteSettings.hiddenGemBias)}
                  onChange={e => updateTasteSetting('hiddenGemBias', e.target.checked)}
                />
                Prefer hidden gems
              </label>
            </div>
            <div className="decade-preference-row" role="group" aria-label="Preferred decades">
              {DECADE_OPTIONS.map(decade => (
                <button
                  key={decade}
                  type="button"
                  className={`decade-chip ${
                    tasteSettings.preferredDecades?.includes(decade) ? 'active' : ''
                  }`}
                  aria-pressed={tasteSettings.preferredDecades?.includes(decade)}
                  onClick={() => togglePreferredDecade(decade)}
                >
                  {decade}s
                </button>
              ))}
            </div>
            <button type="button" className="secondary-button" onClick={resetProfile}>
              Reset taste profile
            </button>
          </div>
        </div>

        <div className="privacy-card glass-card">
          <h3>🔒 Privacy & Local Data</h3>
          <p>
            MoodReel stores your profile, vibes, watchlist, ratings, and taste signals locally in
            this browser. They stay on this device unless you export or share them.
          </p>
          <div className="privacy-data-stats" aria-label="Stored local data summary">
            <span>{watchlist.length} watchlist</span>
            <span>{moodHistory.length} moods</span>
            <span>{watchHistory.length} viewed</span>
            <span>{tasteCounts.liked + tasteCounts.disliked} taste signals</span>
          </div>
          <div className="privacy-api-key">
            <h4>🔐 TMDB API Key</h4>
            <p>{apiKeyStatusMessage}</p>
            <label htmlFor="tmdb-api-key-input" className="sr-only">
              TMDB API key
            </label>
            <input
              id="tmdb-api-key-input"
              type="password"
              placeholder={apiKeyInput ? '' : 'Paste TMDB API key'}
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              disabled={!isApiKeyEditable}
              autoComplete="off"
              aria-label="TMDB API key"
            />
            <div className="privacy-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveApiKey}
                disabled={!isApiKeyEditable}
              >
                Save local key
              </button>
              {apiKeyStatus.source === 'user' && (
                <button
                  type="button"
                  className="text-button danger-text"
                  onClick={handleClearApiKey}
                >
                  Remove local key
                </button>
              )}
            </div>
          </div>
          <div className="privacy-actions">
            <button type="button" className="secondary-button" onClick={handleExportData}>
              Export data
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => importInputRef.current?.click()}
            >
              Import backup
            </button>
            <button
              type="button"
              className="text-button danger-text"
              onClick={handleResetLocalData}
            >
              Reset local data
            </button>
          </div>
          <input
            ref={importInputRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            aria-label="Import MoodReel backup file"
          />
        </div>
      </div>

      <button
        className="share-profile-btn"
        onClick={async () => {
          try {
            await copyToClipboard(window.location.href);
            pushToast({
              icon: '🔗',
              title: 'Link copied',
              message: 'Profile link copied to clipboard.',
              duration: 2600,
            });
          } catch (err) {
            console.error('Copy profile link failed:', err);
            pushToast({
              icon: '⚠️',
              title: 'Copy failed',
              message: 'Your browser blocked clipboard access.',
              variant: 'error',
              duration: 4000,
            });
          }
        }}
      >
        🔗 Share My Vibe
      </button>

      <ConfirmDialog
        isOpen={showResetConfirm}
        mode="confirm"
        title="Reset local MoodReel data?"
        message="This clears profile, saved vibes, watchlist, ratings, history, and preferences on this device."
        confirmLabel="Reset everything"
        destructive
        onConfirm={confirmResetLocalData}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}

export default Profile;
