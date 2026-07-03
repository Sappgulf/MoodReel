import React, { useMemo } from 'react';
import { GENRE_MAP } from '../../utils/mediaUtils';

function getTopGenre(watchlist) {
  const counts = {};
  watchlist.forEach(item => {
    (item.genre_ids || []).forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  const [id, count] = sorted[0];
  return { id: Number(id), name: GENRE_MAP[Number(id)] || `Genre ${id}`, count };
}

function SmartCollections({ watchlist, recentMoods, myServices, tasteCounts, onSelect }) {
  const suggestions = useMemo(() => {
    const items = [];
    const topGenre = getTopGenre(watchlist);

    if (topGenre) {
      items.push({
        id: 'top-genre',
        label: `More ${topGenre.name}`,
        mood: topGenre.name.toLowerCase(),
        filters: { with_genres: String(topGenre.id) },
      });
    }

    const latestMood = recentMoods[recentMoods.length - 1];
    if (latestMood) {
      items.push({
        id: 'latest-mood',
        label: `Again: ${latestMood}`,
        mood: latestMood,
        filters: {},
      });
    }

    if (myServices.length > 0) {
      items.push({
        id: 'my-services',
        label: 'On your services',
        mood: '',
        filters: { with_watch_providers: myServices.join('|') },
      });
    }

    if ((tasteCounts?.liked || 0) > 0) {
      items.push({
        id: 'liked-vibe',
        label: 'Because you liked',
        mood: 'highly rated',
        filters: { sortBy: 'vote_average.desc' },
        minRating: 7,
      });
    }

    return items.slice(0, 4);
  }, [watchlist, recentMoods, myServices, tasteCounts]);

  if (suggestions.length === 0) return null;

  return (
    <div className="smart-collections">
      <span className="smart-collections-label">Smart picks</span>
      <div className="smart-collections-chips">
        {suggestions.map(suggestion => (
          <button
            key={suggestion.id}
            type="button"
            className="smart-collection-chip"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SmartCollections;
