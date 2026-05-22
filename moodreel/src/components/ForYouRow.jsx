import React from 'react';
import { Link } from 'react-router-dom';
import MovieCard from './MovieCard';
import { getDisplayTitle, getPosterUrl } from '../utils/mediaUtils';

function ForYouRow({
  items = [],
  isInWatchlist,
  toggleWatchlist,
  isWatched,
  toggleWatched,
  like,
  dislike,
  statusFor,
  providerSnapshot,
  getProviderKey,
  getCachedTitleProviders,
  region,
}) {
  if (items.length === 0) return null;

  return (
    <section className="for-you-row" aria-labelledby="for-you-heading">
      <div className="for-you-row-header">
        <h2 id="for-you-heading">For you</h2>
        <p className="for-you-row-sub">Picked from your taste and tonight&apos;s mood</p>
      </div>
      <div className="for-you-scroll">
        {items.map((item, idx) => (
          <div key={`${item.media_type}:${item.id}`} className="for-you-card-wrap">
            <MovieCard
              movie={item}
              index={idx}
              isInWatchlist={isInWatchlist(item.id)}
              onToggleWatchlist={toggleWatchlist}
              isWatched={isWatched(item.id)}
              onToggleWatched={toggleWatched}
              mediaType={item.media_type}
              providerBadges={
                (
                  providerSnapshot?.[getProviderKey(item)] ||
                  getCachedTitleProviders?.(item.id, item.media_type, region)
                )?.flatrate?.slice(0, 2) || []
              }
              onLike={like}
              onDislike={dislike}
              tasteStatus={statusFor(item.id, item.media_type)}
              trailerWhisper
              className="for-you-card"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default React.memo(ForYouRow);
