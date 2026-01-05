import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWatchlist } from '../hooks/useWatchlist';
import { useMoodHistory } from '../hooks/useMoodHistory';
import { useRatings } from '../hooks/useRatings';

// Colors for genre chart
const genreColors = [
    '#FFD700', '#DC143C', '#00CED1', '#FF6B6B', '#4CAF50',
    '#9C27B0', '#FF9800', '#2196F3', '#E91E63', '#607D8B'
];

function Stats() {
    const { watchlist } = useWatchlist();
    const { history } = useMoodHistory();
    const { getRating } = useRatings();

    // Calculate stats
    const stats = useMemo(() => {
        const totalMovies = watchlist.length;
        const totalTV = watchlist.filter(m => m.media_type === 'tv').length;
        const totalFilms = totalMovies - totalTV;

        // Average TMDB rating
        const ratingsSum = watchlist.reduce((sum, m) => sum + (m.vote_average || 0), 0);
        const avgTmdbRating = totalMovies > 0 ? (ratingsSum / totalMovies).toFixed(1) : 0;

        // User's average rating
        let userRatingsSum = 0;
        let userRatingsCount = 0;
        watchlist.forEach(m => {
            const rating = getRating(m.id);
            if (rating > 0) {
                userRatingsSum += rating;
                userRatingsCount++;
            }
        });
        const avgUserRating = userRatingsCount > 0 ? (userRatingsSum / userRatingsCount).toFixed(1) : 0;

        // Genre breakdown (from mood history)
        const moodCounts = {};
        history.forEach(mood => {
            moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        });

        // Most searched moods (top 5)
        const topMoods = Object.entries(moodCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return {
            totalMovies,
            totalFilms,
            totalTV,
            avgTmdbRating,
            avgUserRating,
            userRatingsCount,
            topMoods,
            searchCount: history.length
        };
    }, [watchlist, history, getRating]);

    // Simple bar chart for moods
    const maxMoodCount = stats.topMoods.length > 0
        ? Math.max(...stats.topMoods.map(m => m[1]))
        : 1;

    return (
        <div className="stats-page">
            <Link to="/" className="back-button">← Back to Discover</Link>

            <h2>📊 Your Watch Stats</h2>

            {/* Overview Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalMovies}</div>
                    <div className="stat-label">Saved</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalFilms}</div>
                    <div className="stat-label">Movies</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalTV}</div>
                    <div className="stat-label">TV Shows</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">⭐ {stats.avgTmdbRating}</div>
                    <div className="stat-label">Avg Rating</div>
                </div>
            </div>

            {/* User Ratings */}
            {stats.userRatingsCount > 0 && (
                <div className="stats-section">
                    <h3>Your Ratings</h3>
                    <p className="stats-detail">
                        You've rated <strong>{stats.userRatingsCount}</strong> movies
                        with an average of <strong>★ {stats.avgUserRating}/5</strong>
                    </p>
                </div>
            )}

            {/* Top Moods */}
            {stats.topMoods.length > 0 && (
                <div className="stats-section">
                    <h3>Top Mood Searches</h3>
                    <div className="mood-bars">
                        {stats.topMoods.map(([mood, count], i) => (
                            <div key={mood} className="mood-bar-row">
                                <span className="mood-label">{mood}</span>
                                <div className="mood-bar-container">
                                    <div
                                        className="mood-bar"
                                        style={{
                                            width: `${(count / maxMoodCount) * 100}%`,
                                            background: genreColors[i % genreColors.length]
                                        }}
                                    />
                                </div>
                                <span className="mood-count">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Activity */}
            <div className="stats-section">
                <h3>Search Activity</h3>
                <p className="stats-detail">
                    You've searched <strong>{stats.searchCount}</strong> times
                </p>
                <Link to="/calendar" className="view-calendar-btn">
                    📅 View Mood Calendar →
                </Link>
            </div>

            {/* Empty State */}
            {stats.totalMovies === 0 && stats.searchCount === 0 && (
                <div className="empty-state">
                    <div className="icon">📊</div>
                    <h3>No stats yet</h3>
                    <p>Start discovering and saving movies to see your stats!</p>
                    <Link to="/" className="primary-button">
                        Start Exploring
                    </Link>
                </div>
            )}
        </div>
    );
}

export default Stats;
