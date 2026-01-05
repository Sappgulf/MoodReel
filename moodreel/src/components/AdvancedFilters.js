import React, { useState, useCallback } from 'react';

/**
 * Advanced filters component for year range and runtime
 */
function AdvancedFilters({ filters, onFiltersChange }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const currentYear = new Date().getFullYear();

    const handleYearMinChange = useCallback((e) => {
        onFiltersChange({ ...filters, yearMin: parseInt(e.target.value) || 1900 });
    }, [filters, onFiltersChange]);

    const handleYearMaxChange = useCallback((e) => {
        onFiltersChange({ ...filters, yearMax: parseInt(e.target.value) || currentYear });
    }, [filters, onFiltersChange, currentYear]);

    const handleRuntimeChange = useCallback((runtime) => {
        onFiltersChange({ ...filters, runtime });
    }, [filters, onFiltersChange]);

    const activeFilterCount = [
        filters.yearMin > 1900,
        filters.yearMax < currentYear,
        filters.runtime !== 'any'
    ].filter(Boolean).length;

    return (
        <div className="advanced-filters">
            <button
                className={`filters-toggle ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <span>🎛️ Advanced Filters</span>
                {activeFilterCount > 0 && (
                    <span className="filter-badge">{activeFilterCount}</span>
                )}
                <span className="toggle-arrow">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded && (
                <div className="filters-panel">
                    {/* Year Range */}
                    <div className="filter-group">
                        <label>Year Range:</label>
                        <div className="year-inputs">
                            <input
                                type="number"
                                min="1900"
                                max={currentYear}
                                value={filters.yearMin}
                                onChange={handleYearMinChange}
                                placeholder="From"
                            />
                            <span>to</span>
                            <input
                                type="number"
                                min="1900"
                                max={currentYear}
                                value={filters.yearMax}
                                onChange={handleYearMaxChange}
                                placeholder="To"
                            />
                        </div>
                    </div>

                    {/* Sort Order */}
                    <div className="filter-group">
                        <label>Sort By:</label>
                        <div className="runtime-buttons">
                            {[
                                { value: 'popularity.desc', label: '🔥 Trending' },
                                { value: 'vote_average.desc', label: '💎 Hidden Gems' },
                                { value: 'primary_release_date.desc', label: '📅 Newest' },
                                { value: 'primary_release_date.asc', label: '🏛️ Classics' },
                                { value: 'revenue.desc', label: '💰 Box Office' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    className={filters.sortBy === option.value ? 'active' : ''}
                                    onClick={() => onFiltersChange({ ...filters, sortBy: option.value })}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Runtime */}
                    <div className="filter-group">
                        <label>Runtime:</label>
                        <div className="runtime-buttons">
                            {[
                                { value: 'any', label: 'Any', icon: '🎬' },
                                { value: 'short', label: '<90 min', icon: '⚡' },
                                { value: 'medium', label: '90-150 min', icon: '🎯' },
                                { value: 'long', label: '>150 min', icon: '🎭' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    className={filters.runtime === option.value ? 'active' : ''}
                                    onClick={() => handleRuntimeChange(option.value)}
                                >
                                    {option.icon} {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick reset */}
                    {activeFilterCount > 0 && (
                        <button
                            className="reset-filters"
                            onClick={() => onFiltersChange({
                                yearMin: 1900,
                                yearMax: currentYear,
                                runtime: 'any',
                                sortBy: 'popularity.desc'
                            })}
                        >
                            ✕ Clear Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default React.memo(AdvancedFilters);
