import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMoodHistory } from '../hooks/useMoodHistory';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';

// Mood to color mapping
const moodColors = {
  happy: '#FFD700',
  comedy: '#FFD700',
  funny: '#FFD700',
  sad: '#6B8DD6',
  emotional: '#6B8DD6',
  dramatic: '#6B8DD6',
  horror: '#DC143C',
  scary: '#DC143C',
  thriller: '#DC143C',
  action: '#FF6B6B',
  adventure: '#FF8C00',
  romance: '#FF69B4',
  romantic: '#FF69B4',
  'sci-fi': '#00CED1',
  fantasy: '#9C27B0',
  documentary: '#4CAF50',
  default: '#888888',
};

function getMoodColor(mood) {
  const lower = mood.toLowerCase();
  for (const [key, color] of Object.entries(moodColors)) {
    if (lower.includes(key)) return color;
  }
  return moodColors.default;
}

function formatDateLabel(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function MoodCalendar() {
  const { history, historyWithDates, clearHistory } = useMoodHistory();

  // Generate calendar data for the last 30 days
  const calendarData = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Find moods from that day
      const dayMoods = historyWithDates?.filter(h => h.date?.startsWith(dateStr)) || [];

      days.push({
        date,
        dateStr,
        dayOfWeek: date.getDay(),
        dayOfMonth: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        moods: dayMoods.map(h => h.mood),
        hasActivity: dayMoods.length > 0,
      });
    }
    return days;
  }, [historyWithDates]);

  const calendarSummary = useMemo(() => {
    const activeDays = calendarData.filter(day => day.hasActivity);
    const moodCounts = historyWithDates.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';

    let currentStreak = 0;
    for (let i = calendarData.length - 1; i >= 0; i -= 1) {
      if (!calendarData[i].hasActivity) break;
      currentStreak += 1;
    }

    return {
      activeDays: activeDays.length,
      totalSearches: historyWithDates.length,
      topMood,
      currentStreak,
    };
  }, [calendarData, historyWithDates]);

  // Get week labels
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearHistory = () => {
    setShowClearConfirm(true);
  };

  return (
    <div className="calendar-page">
      <div className="calendar-page-header">
        <Link to="/" className="back-button">
          ← Back to Discover
        </Link>
        {history.length > 0 && (
          <button onClick={handleClearHistory} className="clear-history-btn">
            🗑️ Clear Log
          </button>
        )}
      </div>

      <div className="page-hero calendar-hero">
        <div>
          <p className="details-kicker">Mood rhythm</p>
          <h2 className="page-title">Mood Calendar</h2>
          <p className="page-subtitle">
            A 30-day view of what you have been asking MoodReel to find.
          </p>
        </div>
        {history.length > 0 && <div className="page-hero-chip">Last 30 days</div>}
      </div>

      <div className="calendar-insights" aria-label="Mood calendar summary">
        <div className="calendar-insight">
          <span>{calendarSummary.activeDays}</span>
          <p>active days</p>
        </div>
        <div className="calendar-insight">
          <span>{calendarSummary.totalSearches}</span>
          <p>mood searches</p>
        </div>
        <div className="calendar-insight">
          <span>{calendarSummary.currentStreak}</span>
          <p>day streak</p>
        </div>
        <div className="calendar-insight calendar-insight-wide">
          <span>{calendarSummary.topMood}</span>
          <p>top mood</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-container">
        {/* Week day headers */}
        <div className="calendar-header">
          {weekDays.map(day => (
            <div key={day} className="calendar-header-cell">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="calendar-grid">
          {/* Add empty cells for alignment */}
          {calendarData.length > 0 &&
            Array(calendarData[0].dayOfWeek)
              .fill(null)
              .map((_, i) => <div key={`empty-${i}`} className="calendar-cell empty" />)}

          {calendarData.map(day => (
            <div
              key={day.dateStr}
              className={`calendar-cell ${day.hasActivity ? 'active' : ''}`}
              title={
                day.moods.length > 0
                  ? `${day.month} ${day.dayOfMonth}: ${day.moods.join(', ')}`
                  : `${day.month} ${day.dayOfMonth}`
              }
            >
              <span className="day-number">
                <span>{day.dayOfMonth}</span>
                <span className="day-month">{formatDateLabel(day.date)}</span>
              </span>
              {day.moods.length > 0 && (
                <div className="mood-dots" aria-label={`${day.moods.length} mood searches`}>
                  {day.moods.slice(0, 2).map((mood, i) => (
                    <span
                      key={`${mood}-${i}`}
                      className="mood-dot"
                      style={{
                        '--mood-color': getMoodColor(mood),
                      }}
                    >
                      {mood}
                    </span>
                  ))}
                  {day.moods.length > 2 && (
                    <span className="more-moods">+{day.moods.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <h4>Mood Colors</h4>
        <div className="legend-items">
          {Object.entries({
            '😊 Happy/Comedy': '#FFD700',
            '😢 Sad/Drama': '#6B8DD6',
            '😱 Horror/Thriller': '#DC143C',
            '💕 Romance': '#FF69B4',
            '🚀 Sci-Fi': '#00CED1',
            '🧙 Fantasy': '#9C27B0',
          }).map(([label, color]) => (
            <div key={label} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Searches */}
      {history.length > 0 && (
        <div className="recent-searches">
          <h4>Recent Searches</h4>
          <div className="search-chips">
            {history.slice(0, 10).map((mood, i) => (
              <span key={i} className="search-chip" style={{ borderColor: getMoodColor(mood) }}>
                {mood}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && (
        <EmptyState variant="calendar">
          <div className="empty-state-steps" aria-label="Mood calendar examples">
            <span>cozy mystery</span>
            <span>date night</span>
            <span>mind-bending sci-fi</span>
          </div>
        </EmptyState>
      )}

      <Link to="/stats" className="view-stats-link">
        📊 View Full Stats →
      </Link>

      <ConfirmDialog
        isOpen={showClearConfirm}
        mode="confirm"
        title="Clear mood history?"
        message="This removes all saved mood searches on this device. This cannot be undone."
        confirmLabel="Clear history"
        destructive
        onConfirm={() => {
          clearHistory();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}

export default MoodCalendar;
