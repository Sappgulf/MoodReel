import MovieCard from '../MovieCard';
import { getCachedTitleProviders } from '../../services/providerService';

export default function OnMyServicesStrip({
  recommendations,
  hasAnySearch,
  myServices,
  providerSnapshot,
  getProviderKey,
  contentType,
  region,
  isInWatchlist,
  toggleWatchlist,
  isWatched,
  toggleWatched,
  like,
  dislike,
  statusFor,
}) {
  if (hasAnySearch || myServices.length === 0 || recommendations.length === 0) {
    return null;
  }

  const seen = new Set();
  const list = [];
  for (const item of recommendations) {
    const mediaType = item.media_type || contentType;
    const key = `${mediaType}:${item.id}`;
    if (seen.has(key)) continue;
    const cached =
      providerSnapshot[getProviderKey(item)] || getCachedTitleProviders(item.id, mediaType, region);
    if (!cached) continue;
    const ids = [
      ...(cached.flatrate || []).map(p => p.id),
      ...(cached.rent || []).map(p => p.id),
      ...(cached.buy || []).map(p => p.id),
    ];
    if (!ids.length) continue;
    if (!myServices.some(id => ids.includes(id))) continue;
    seen.add(key);
    list.push(item);
    if (list.length >= 6) break;
  }

  if (list.length === 0) return null;

  return (
    <section className="on-my-services-section">
      <header className="section-header">
        <h2>📺 On Your Services</h2>
        <p className="section-subtitle">
          Trending picks that stream on the services you follow in {region}.
        </p>
      </header>
      <div className="recommendations">
        {list.map((item, idx) => (
          <MovieCard
            key={`myservices-${item.id}-${item.media_type || contentType}`}
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
