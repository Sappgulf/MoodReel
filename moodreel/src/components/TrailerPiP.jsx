import React, { useState } from 'react';

function TrailerPiP({ videoKey, title, onClose }) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!videoKey) return null;

  return (
    <div className={`trailer-pip ${isMinimized ? 'minimized' : ''}`}>
      <div className="pip-header">
        <span className="pip-title">{title}</span>
        <div className="pip-controls">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            aria-label={isMinimized ? 'Expand trailer' : 'Minimize trailer'}
          >
            {isMinimized ? '🔳' : '➖'}
          </button>
          <button type="button" onClick={onClose} aria-label="Close trailer">
            ✕
          </button>
        </div>
      </div>
      {!isMinimized && (
        <div className="pip-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=1`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}
      {isMinimized && (
        <button type="button" className="pip-placeholder" onClick={() => setIsMinimized(false)}>
          <span>▶️ Resume Trailer</span>
        </button>
      )}
    </div>
  );
}

export default TrailerPiP;
