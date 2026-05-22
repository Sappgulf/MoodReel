import React, { useMemo } from 'react';
import { genreNames } from '../utils/moodParser';

function LivingFilterChips({
  mood,
  selectedGenres = [],
  selectedProviders = [],
  providerCatalog = [],
  minRating = 0,
  advancedFilters = {},
  currentYear,
  onClearMood,
  onRemoveGenre,
  onRemoveProvider,
  onClearRating,
  onClearYears,
  onSearch,
  playSound,
}) {
  const chips = useMemo(() => {
    const list = [];
    if (mood?.trim()) {
      list.push({
        key: 'mood',
        label: `Mood: ${mood.trim()}`,
        onRemove: onClearMood,
      });
    }
    selectedGenres.forEach(id => {
      list.push({
        key: `genre-${id}`,
        label: genreNames[id] || `Genre ${id}`,
        onRemove: () => onRemoveGenre(id),
      });
    });
    selectedProviders.forEach(id => {
      const name =
        providerCatalog.find(p => p.provider_id === id || p.id === id)?.provider_name ||
        providerCatalog.find(p => p.id === id)?.name ||
        `Service ${id}`;
      list.push({
        key: `provider-${id}`,
        label: name,
        onRemove: () => onRemoveProvider(id),
      });
    });
    if (minRating > 0) {
      list.push({
        key: 'rating',
        label: `Rating ≥ ${minRating}`,
        onRemove: onClearRating,
      });
    }
    if (advancedFilters.yearMin > 1900 || advancedFilters.yearMax < currentYear) {
      list.push({
        key: 'years',
        label: `${advancedFilters.yearMin || 1900}–${advancedFilters.yearMax || currentYear}`,
        onRemove: onClearYears,
      });
    }
    return list;
  }, [
    mood,
    selectedGenres,
    selectedProviders,
    providerCatalog,
    minRating,
    advancedFilters,
    currentYear,
    onClearMood,
    onRemoveGenre,
    onRemoveProvider,
    onClearRating,
    onClearYears,
  ]);

  if (chips.length === 0) return null;

  const handleRemove = chip => {
    playSound?.('pop');
    chip.onRemove();
    if (onSearch) window.setTimeout(() => onSearch(), 0);
  };

  return (
    <div className="living-filter-chips" role="list" aria-label="Active filters">
      {chips.map(chip => (
        <button
          key={chip.key}
          type="button"
          className="living-filter-chip"
          role="listitem"
          onClick={() => handleRemove(chip)}
          aria-label={`Remove ${chip.label}`}
        >
          <span>{chip.label}</span>
          <span className="living-filter-chip-x" aria-hidden="true">
            ✕
          </span>
        </button>
      ))}
    </div>
  );
}

export default React.memo(LivingFilterChips);
