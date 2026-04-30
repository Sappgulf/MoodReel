import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWatchlist } from '../hooks/useWatchlist';
import { useMoodHistory } from '../hooks/useMoodHistory';
import { useRatings } from '../hooks/useRatings';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { GENRE_MAP } from '../utils/mediaUtils';
import MediaImage from '../components/MediaImage';
import GenrePieChart from '../components/GenrePieChart';
import CountUp from '../components/CountUp';

// Colors for genre chart
const genreColors = [
  '#FFD700',
  '#DC143C',
  '#00CED1',
  '#FF6B6B',
  '#4CAF50',
  '#9C27B0',
  '#FF9800',
  '#2196F3',
  '#E91E63',
  '#607D8B',
];

function Stats() {
  const { watchlist } = useWatchlist();
  const { history } = useMoodHistory();
  const { getRating } = useRatings();
  const { history: watchHistory, getStats: getWatchStats } = useWatchHistory();
  const watchStats = useMemo(() => getWatchStats(), [getWatchStats]);

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

    // Cinematic DNA aggregation
    const actorCounts = {};
    const directorCounts = {};

    watchHistory.forEach(movie => {
      (movie.cast || []).forEach(actor => {
        actorCounts[actor] = (actorCounts[actor] || 0) + 1;
      });
      (movie.directors || []).forEach(director => {
        if (!directorCounts[director]) {
          directorCounts[director] = { count: 0, movies: [] };
        }
        directorCounts[director].count += 1;
        directorCounts[director].movies.push(movie.title);
      });
    });

    // Mood aggregation (from search history)
    const moodCounts = {};
    history.forEach(mood => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    const topMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Genre breakdown from watchlist
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

    const topActors = Object.entries(actorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topDirectors = Object.entries(directorCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([name, data]) => ({ name, count: data.count, movies: [...new Set(data.movies)] }));

    return {
      totalMovies,
      totalFilms,
      totalTV,
      avgTmdbRating,
      avgUserRating,
      userRatingsCount,
      topMoods,
      genreData,
      topActors,
      topDirectors,
      searchCount: history.length,
      decades: Object.entries(
        watchlist.reduce((acc, movie) => {
          const year = new Date(
            movie.release_date || movie.first_air_date || Date.now()
          ).getFullYear();
          const decade = Math.floor(year / 10) * 10;
          acc[decade] = (acc[decade] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]), // Sort by count desc
    };
  }, [watchlist, history, getRating, watchHistory]);

  // Simple bar chart for moods
  const maxMoodCount = stats.topMoods.length > 0 ? Math.max(...stats.topMoods.map(m => m[1])) : 1;

  return (
    <div className="stats-page">
      <Link to="/" className="back-button">
        ← Back to Discover
      </Link>

      <div className="page-hero">
        <div>
          <h2 className="page-title">📊 Your Watch Stats</h2>
          <p className="page-subtitle">
            {stats.totalMovies} saved · {stats.searchCount} searches · {stats.userRatingsCount}{' '}
            ratings
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-value">
            <CountUp end={stats.totalMovies} />
          </div>
          <div className="stat-label">Total Saved</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-value">
            <CountUp end={stats.totalFilms} />
          </div>
          <div className="stat-label">Movies</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-value">
            <CountUp end={stats.totalTV} />
          </div>
          <div className="stat-label">TV Shows</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-value">
            ⭐ <CountUp end={stats.avgTmdbRating} />
          </div>
          <div className="stat-label">Avg TMDB</div>
        </div>
      </div>

      {/* User Ratings */}
      {stats.userRatingsCount > 0 && (
        <div className="stats-section">
          <h3>Your Ratings</h3>
          <p className="stats-detail">
            You've rated <strong>{stats.userRatingsCount}</strong> movies with an average of{' '}
            <strong>★ {stats.avgUserRating}/5</strong>
          </p>
        </div>
      )}

      {/* Genre Pie Chart */}
      {stats.genreData.length > 0 && (
        <div className="stats-section">
          <h3>🎬 Genre Breakdown</h3>
          <GenrePieChart data={stats.genreData} size={220} />
        </div>
      )}

      {/* Movie vs TV Ratio */}
      {stats.totalMovies > 0 && (
        <div className="stats-section">
          <h3>🎬 Movies vs 📺 TV Shows</h3>
          <div className="ratio-bar">
            <div
              className="ratio-movies"
              style={{ width: `${(stats.totalFilms / stats.totalMovies) * 100}%` }}
            >
              {stats.totalFilms > 0 &&
                `${Math.round((stats.totalFilms / stats.totalMovies) * 100)}%`}
            </div>
            <div
              className="ratio-tv"
              style={{ width: `${(stats.totalTV / stats.totalMovies) * 100}%` }}
            >
              {stats.totalTV > 0 && `${Math.round((stats.totalTV / stats.totalMovies) * 100)}%`}
            </div>
          </div>
          <div className="ratio-legend">
            <span>🎬 {stats.totalFilms} Movies</span>
            <span>📺 {stats.totalTV} TV Shows</span>
          </div>
        </div>
      )}

      {/* Cinematic DNA */}
      {(stats.topActors.length > 0 || stats.topDirectors.length > 0) && (
        <div className="stats-section dna-section glass-panel">
          <h3>🧬 Your Cinematic DNA</h3>
          <p className="section-subtitle">Based on your watch history and saved favorites</p>
          <div className="dna-grid">
            <div className="dna-category">
              <h4>🌟 Top Stars</h4>
              <div className="dna-list">
                {stats.topActors.map((actor, i) => (
                  <div key={actor.name} className="dna-item">
                    <span className="dna-rank">#{i + 1}</span>
                    <span className="dna-name">{actor.name}</span>
                    <span className="dna-count">{actor.count} titles</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="dna-category">
              <h4>🎬 Top Directors</h4>
              <div className="dna-list">
                {stats.topDirectors.map((director, i) => (
                  <div key={director.name} className="dna-item director-dna-item">
                    <div className="dna-item-header">
                      <span className="dna-rank">#{i + 1}</span>
                      <span className="dna-name">{director.name}</span>
                      <span className="dna-count">{director.count} titles</span>
                    </div>
                    <div className="dna-movie-list">
                      {director.movies.slice(0, 2).map((m, j) => (
                        <span key={j} className="dna-movie-tag">
                          {m}
                        </span>
                      ))}
                      {director.movies.length > 2 && (
                        <span className="dna-movie-tag">+{director.movies.length - 2} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Favorite Decades */}
      {stats.decades.length > 0 && (
        <div className="stats-section">
          <h3>🕰️ Favorite Eras</h3>
          <div className="decades-grid">
            {stats.decades.map(([decade, count]) => (
              <div key={decade} className="decade-item">
                <span className="decade-label">{decade}s</span>
                <span className="decade-count">{count} titles</span>
              </div>
            ))}
          </div>
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
                      background: genreColors[i % genreColors.length],
                    }}
                  />
                </div>
                <span className="mood-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discovery Timeline */}
      {watchHistory.length > 0 && (
        <div className="stats-section">
          <h3>📱 Discovery Timeline</h3>
          <div className="discovery-stats">
            <span className="discovery-stat">
              <strong>{watchStats.thisWeek}</strong> this week
            </span>
            <span className="discovery-stat">
              <strong>{watchStats.thisMonth}</strong> this month
            </span>
            <span className="discovery-stat">
              <strong>{watchStats.total}</strong> total
            </span>
          </div>
          <div className="recent-discoveries">
            <p className="section-subtitle">Recently Viewed</p>
            <div className="discovery-grid">
              {watchHistory.slice(0, 8).map(item => (
                <Link
                  key={item.id}
                  to={`/${item.media_type}/${item.id}`}
                  className="discovery-item"
                >
                  {item.poster_path ? (
                    <MediaImage
                      path={item.poster_path}
                      size="w92"
                      alt={item.title}
                      className="discovery-poster"
                      loading="lazy"
                    />
                  ) : (
                    <div className="discovery-poster-placeholder">🎬</div>
                  )}
                </Link>
              ))}
            </div>
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
