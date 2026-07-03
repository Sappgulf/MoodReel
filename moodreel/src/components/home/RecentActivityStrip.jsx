import React from 'react';
import { Link } from 'react-router-dom';
import { getDisplayTitle } from '../../utils/mediaUtils';

function formatWhen(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function RecentActivityStrip({ recentMoods = [], watchHistory = [], hasAnySearch }) {
  if (hasAnySearch) return null;

  const recentWatches = watchHistory.slice(0, 4);
  if (recentMoods.length === 0 && recentWatches.length === 0) return null;

  return (
    <section className="recent-activity-section" aria-labelledby="recent-activity-heading">
      <div className="section-header">
        <h2 id="recent-activity-heading">Recent Activity</h2>
        <Link to="/calendar" className="text-button btn-sm">
          View calendar
        </Link>
      </div>
      <div className="recent-activity-grid">
        {recentMoods.slice(0, 5).map((mood, idx) => (
          <div key={`mood-${idx}`} className="recent-activity-card recent-activity-mood">
            <span aria-hidden="true">✨</span>
            <span className="recent-activity-title">{mood}</span>
            <span className="recent-activity-meta">mood</span>
          </div>
        ))}
        {recentWatches.map(item => (
          <Link
            key={`watch-${item.id}-${item.media_type || 'movie'}`}
            to={`/${item.media_type || 'movie'}/${item.id}`}
            state={{ item }}
            className="recent-activity-card recent-activity-watch"
          >
            <span aria-hidden="true">👁</span>
            <span className="recent-activity-title">{getDisplayTitle(item)}</span>
            <span className="recent-activity-meta">{formatWhen(item.watchedAt)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
