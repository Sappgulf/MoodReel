import { Link } from 'react-router-dom';

export default function SurpriseWinnerBanner({ surpriseMovie, onClose }) {
  if (!surpriseMovie) return null;

  return (
    <div
      className="surprise-banner"
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClose();
        }
      }}
      aria-label={`Surprise pick: ${surpriseMovie.title || surpriseMovie.name}. Press Enter to dismiss.`}
    >
      <span className="surprise-icon" aria-hidden="true">
        🎉
      </span>
      <div className="surprise-content">
        <p>We found a gem for you!</p>
        <h3>{surpriseMovie.title || surpriseMovie.name}</h3>
      </div>
      <div className="surprise-actions">
        <Link
          to={`/${surpriseMovie.media_type || 'movie'}/${surpriseMovie.id}`}
          className="surprise-link primary"
          onClick={e => e.stopPropagation()}
        >
          Watch Now
        </Link>
        <button
          className="surprise-link secondary"
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
          type="button"
        >
          Close
        </button>
      </div>
    </div>
  );
}
