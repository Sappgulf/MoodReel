import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import MediaImage from '../MediaImage';
import { getDisplayTitle, getReleaseYear } from '../../utils/mediaUtils';

export default function SurpriseWinnerBanner({ surpriseMovie, onClose }) {
  if (!surpriseMovie) return null;

  const title = getDisplayTitle(surpriseMovie);
  const year = getReleaseYear(surpriseMovie);
  const mediaLabel = (surpriseMovie.media_type || 'movie') === 'tv' ? 'Series' : 'Film';
  const rating =
    surpriseMovie.vote_average > 0 ? `${Number(surpriseMovie.vote_average).toFixed(1)} / 10` : '';
  const meta = [year, rating, mediaLabel].filter(Boolean);
  const detailPath = `/${surpriseMovie.media_type || 'movie'}/${surpriseMovie.id}`;
  const artworkSources = [
    surpriseMovie.poster_path
      ? { path: surpriseMovie.poster_path, type: 'poster', size: 'w185' }
      : null,
    surpriseMovie.backdrop_path
      ? { path: surpriseMovie.backdrop_path, type: 'backdrop', size: 'w780' }
      : null,
  ].filter(Boolean);

  const banner = (
    <aside className="surprise-banner" role="status" aria-live="polite">
      <Link to={detailPath} className="surprise-thumb" aria-label={`Open ${title} details`}>
        {artworkSources.length > 0 ? (
          <MediaImage sources={artworkSources} alt="" loading="eager" />
        ) : (
          <span className="surprise-icon" aria-hidden="true">
            🎉
          </span>
        )}
      </Link>
      <div className="surprise-content">
        <p>Shuffle picked</p>
        <h3>{title}</h3>
        {meta.length > 0 && <span className="surprise-meta">{meta.join(' · ')}</span>}
      </div>
      <div className="surprise-actions">
        <Link to={detailPath} className="surprise-link primary">
          Watch Now
        </Link>
        <button className="surprise-link secondary" onClick={onClose} type="button">
          Close
        </button>
      </div>
    </aside>
  );

  if (typeof document === 'undefined') {
    return banner;
  }

  return createPortal(banner, document.body);
}
