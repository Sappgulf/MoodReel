import React from 'react';

function ScoreBreakdown({ rows = [], title = 'Score breakdown' }) {
  if (!rows.length) return null;

  return (
    <div className="score-breakdown" aria-label={title}>
      <span className="score-breakdown-title">{title}</span>
      <div className="score-breakdown-grid">
        {rows.map(row => (
          <div key={row.label} className={`score-breakdown-row ${row.tone || 'neutral'}`}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default React.memo(ScoreBreakdown);
