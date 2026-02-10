import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAchievements } from '../hooks/useAchievements';
import { useWatchlist } from '../hooks/useWatchlist';
import { useMoodHistory } from '../hooks/useMoodHistory';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useProviderSettings } from '../hooks/useProviderSettings';
import { useTasteProfile } from '../hooks/useTasteProfile';
import { useToasts } from '../context/ToastContext';
import { calculatePersona } from '../utils/personaUtils';
import { copyToClipboard } from '../utils/clipboard';

const AVATARS = ['🎬', '🍿', '⭐', '🎭', '🎥', '🎞️', '🎟️', '📺', '🎧', '🎮', '💡', '✨'];

const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

const REGIONS = [
    { code: 'US', label: 'United States' },
    { code: 'CA', label: 'Canada' },
    { code: 'GB', label: 'United Kingdom' },
    { code: 'AU', label: 'Australia' },
    { code: 'DE', label: 'Germany' },
    { code: 'FR', label: 'France' },
    { code: 'JP', label: 'Japan' },
    { code: 'BR', label: 'Brazil' }
];

function Profile() {
    const { profile, updateProfile } = useUserProfile();
    const { exp, level, progressToNextLevel, achievements } = useAchievements();
    const { watchlist } = useWatchlist();
    const { history: moodHistory } = useMoodHistory();
    const { history: watchHistory } = useWatchHistory();
    const { region, setRegion } = useProviderSettings();
    const { resetProfile, tasteCounts } = useTasteProfile();
    const { pushToast } = useToasts();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(profile);

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
            genreData
        };
    }, [watchlist, watchHistory]);

    const persona = useMemo(() => calculatePersona(stats), [stats]);

    const handleSave = () => {
        updateProfile(editForm);
        setIsEditing(false);
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
                        <p className="join-date">Member since {new Date(profile.joinDate).toLocaleDateString()}</p>
                        <div className="level-badge">Level {level}</div>
                    </div>
                    <button className="edit-profile-btn" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                        {isEditing ? '✅ Save' : '📂 Edit Profile'}
                    </button>
                </div>

                <div className="profile-experience">
                    <div className="exp-label">
                        <span>XP: {exp}</span>
                        <span>Next Level: {Math.ceil(progressToNextLevel)}%</span>
                    </div>
                    <div className="exp-bar-container">
                        <div className="exp-bar-fill" style={{ width: `${progressToNextLevel}%` }}></div>
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
                            <span className="stat-value">{achievements.filter(a => a.unlocked).length}</span>
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
                                                animationDelay: `${i * 0.1}s`
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
                    <select
                        id="region-select"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                    >
                        {REGIONS.map((regionOption) => (
                            <option key={regionOption.code} value={regionOption.code}>
                                {regionOption.label}
                            </option>
                        ))}
                    </select>
                    <div className="taste-profile-summary">
                        <h4>🎯 Taste Profile</h4>
                        <p>Liked: {tasteCounts.liked} • Disliked: {tasteCounts.disliked}</p>
                        <button className="secondary-button" onClick={resetProfile}>
                            Reset taste profile
                        </button>
                    </div>
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
	                            duration: 2600
	                        });
	                    } catch (err) {
	                        console.error('Copy profile link failed:', err);
	                        pushToast({
	                            icon: '⚠️',
	                            title: 'Copy failed',
	                            message: 'Your browser blocked clipboard access.',
	                            variant: 'error',
	                            duration: 4000
	                        });
	                    }
	                }}
	            >
	                🔗 Share My Vibe
	            </button>
	        </div>
	    );
}

export default Profile;
