import MovieCard from '../MovieCard';
import { getCachedTitleProviders } from '../../services/providerService';

export default function HomeTrendingStrip({
  trending,
  recommendationsLength,
  hasAnySearch,
  region,
  providerSnapshot,
  getProviderKey,
  isInWatchlist,
  toggleWatchlist,
  isWatched,
  toggleWatched,
  like,
  dislike,
  statusFor,
}) {
  if (!(trending.length > 0 && recommendationsLength === 0 && !hasAnySearch)) {
    return null;
  }

  return (
    <section className="trending-section">
      <h2>🔥 Trending Now</h2>
      <div className="recommendations">
        {trending.map((item, idx) => (
          <MovieCard
            key={item.id}
            movie={item}
            isInWatchlist={isInWatchlist(item.id, item.media_type)}
            onToggleWatchlist={toggleWatchlist}
            isWatched={isWatched(item.id, item.media_type)}
            onToggleWatched={toggleWatched}
            mediaType={item.media_type}
            providerBadges={
              (
                providerSnapshot[getProviderKey(item)] ||
                getCachedTitleProviders(item.id, item.media_type, region)
              )?.flatrate?.slice(0, 3) || []
            }
            onLike={like}
            onDislike={dislike}
            tasteStatus={statusFor(item.id, item.media_type)}
            index={idx}
          />
        ))}
      </div>
    </section>
  );
}
