import MovieCard from '../MovieCard';

export default function ContinueWatchingStrip({
  history,
  hasAnySearch,
  isInWatchlist,
  toggleWatchlist,
  isWatched,
  toggleWatched,
  like,
  dislike,
  statusFor,
}) {
  if (hasAnySearch || !history || history.length === 0) {
    return null;
  }

  const seen = new Set();
  const list = [];
  for (const entry of history) {
    const key = `${entry.media_type || 'movie'}:${entry.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (isWatched(entry.id, entry.media_type || 'movie')) continue;
    if (statusFor(entry.id, entry.media_type || 'movie') === 'disliked') continue;
    list.push({
      id: entry.id,
      title: entry.title,
      poster_path: entry.poster_path,
      media_type: entry.media_type || 'movie',
      overview: '',
      vote_average: 0,
      release_date: '',
      first_air_date: '',
      release_year: '',
      viewedAt: entry.viewedAt,
    });
    if (list.length >= 8) break;
  }

  if (list.length === 0) return null;

  return (
    <section className="continue-watching-section">
      <header className="section-header">
        <h2>▶️ Continue Watching</h2>
        <p className="section-subtitle">Picks you opened but haven&apos;t marked watched yet.</p>
      </header>
      <div className="recommendations">
        {list.map((item, idx) => (
          <MovieCard
            key={`${item.media_type}:${item.id}`}
            movie={item}
            isInWatchlist={isInWatchlist(item.id, item.media_type)}
            onToggleWatchlist={toggleWatchlist}
            isWatched={isWatched(item.id, item.media_type)}
            onToggleWatched={toggleWatched}
            mediaType={item.media_type}
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
