import React from 'react';
import MediaImage from './MediaImage';
import { getDisplayTitle, getReleaseYear } from '../utils/mediaUtils';

function ShareableVibeCard({ item, caption = 'MoodReel pick' }) {
  if (!item) return null;
  const title = getDisplayTitle(item);
  const year = getReleaseYear(item);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '';

  return (
    <div className="shareable-vibe-card" aria-label={`Shareable card for ${title}`}>
      <div className="shareable-vibe-art">
        <MediaImage
          path={item.backdrop_path || item.poster_path}
          type={item.backdrop_path ? 'backdrop' : 'poster'}
          size={item.backdrop_path ? 'w780' : 'w500'}
          alt=""
          loading="lazy"
        />
      </div>
      <div className="shareable-vibe-copy">
        <span>{caption}</span>
        <strong>{title}</strong>
        <small>{[year, rating ? `${rating} TMDB` : 'MoodReel'].filter(Boolean).join(' · ')}</small>
      </div>
    </div>
  );
}

export default React.memo(ShareableVibeCard);
