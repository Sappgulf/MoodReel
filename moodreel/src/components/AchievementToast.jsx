import React from 'react';

/**
 * Toast notification for newly unlocked achievements
 */
function AchievementToast({ achievement, onDismiss }) {
  if (!achievement) return null;

  return (
    <div className="achievement-toast" onClick={onDismiss}>
      <div className="toast-icon">{achievement.icon}</div>
      <div className="toast-content">
        <p className="toast-label">Achievement Unlocked!</p>
        <h4 className="toast-title">{achievement.title}</h4>
        <p className="toast-description">{achievement.description}</p>
      </div>
      <button className="toast-dismiss" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

export default React.memo(AchievementToast);
