import React, { useMemo } from 'react';
import { describeActiveFilters } from '../utils/searchContext';

function FilterSummary({
  mood,
  selectedGenres,
  selectedProviders,
  providerCatalog,
  minRating,
  matchType,
  contentType,
  advancedFilters,
  myServices,
}) {
  const { chips, summary, logicHint } = useMemo(
    () =>
      describeActiveFilters({
        mood,
        selectedGenres,
        selectedProviders,
        providerCatalog,
        minRating,
        matchType,
        contentType,
        advancedFilters,
        myServices,
      }),
    [
      mood,
      selectedGenres,
      selectedProviders,
      providerCatalog,
      minRating,
      matchType,
      contentType,
      advancedFilters,
      myServices,
    ]
  );

  if (chips.length === 0) {
    return (
      <div className="filter-summary filter-summary--empty" role="status">
        <p className="filter-summary-hint">{logicHint}</p>
      </div>
    );
  }

  return (
    <div className="filter-summary" role="status" aria-live="polite">
      <p className="filter-summary-title">Active filters</p>
      <ul className="filter-summary-chips">
        {chips.map(chip => (
          <li
            key={chip.key}
            className={`filter-summary-chip filter-summary-chip--${chip.logic || 'default'}`}
          >
            {chip.label}
          </li>
        ))}
      </ul>
      {logicHint && <p className="filter-summary-hint">{logicHint}</p>}
      <p className="filter-summary-sr">{summary}</p>
    </div>
  );
}

export default React.memo(FilterSummary);
