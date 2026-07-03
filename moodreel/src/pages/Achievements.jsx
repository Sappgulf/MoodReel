import React from 'react';
import { Link } from 'react-router-dom';
import { useAchievements } from '../hooks/useAchievements';
import EmptyState from '../components/EmptyState';

/**
 * Achievements page showing all badges and progress
 */
function Achievements() {
  const { achievements, unlockedCount, totalCount } = useAchievements();

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  return (
    <div className="achievements-page">
      <Link to="/" className="back-button">
        ← Back to Discover
      </Link>

      <div className="page-hero">
        <div>
          <h2 className="page-title">Achievements</h2>
          <p className="page-subtitle">Unlock badges by saving, rating, and exploring.</p>
        </div>
        <div className="page-hero-chip">
          {unlockedCount} / {totalCount}
        </div>
      </div>

      <p className="achievements-progress">
        {unlockedCount} / {totalCount} unlocked
      </p>

      {/* Progress bar */}
      <div className="achievements-progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Unlocked achievements */}
      {unlockedAchievements.length > 0 && (
        <section className="achievements-section">
          <h3>Unlocked</h3>
          <div className="achievements-grid">
            {unlockedAchievements.map(achievement => (
              <div key={achievement.id} className="achievement-card unlocked">
                <div className="achievement-icon">{achievement.icon}</div>
                <h4>{achievement.title}</h4>
                <p>{achievement.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Locked achievements */}
      {lockedAchievements.length > 0 && (
        <section className="achievements-section">
          <h3>Locked</h3>
          <div className="achievements-grid">
            {lockedAchievements.map(achievement => (
              <div key={achievement.id} className="achievement-card locked">
                <div className="achievement-icon locked-icon">{achievement.icon}</div>
                <h4>{achievement.title}</h4>
                <p>{achievement.description}</p>
                <div className="achievement-progress">
                  <div
                    className="achievement-progress-fill"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
                <span className="progress-text">{Math.round(achievement.progress)}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {unlockedCount === 0 && (
        <EmptyState
          variant="achievements"
          title="Start earning achievements"
          description="Save, rate, search, and try Tonight Mode to unlock your first badges."
        >
          <div className="empty-state-steps" aria-label="Achievement starters">
            <span>Save a pick</span>
            <span>Rate a title</span>
            <span>Try a new mood</span>
          </div>
        </EmptyState>
      )}
    </div>
  );
}

export default Achievements;
