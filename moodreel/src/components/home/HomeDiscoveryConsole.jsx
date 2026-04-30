import MoodPlaylists from '../MoodPlaylists';
import StreamingFilter from '../StreamingFilter';
import RatingFilter from '../RatingFilter';
import AdvancedFilters from '../AdvancedFilters';
import { copyToClipboard } from '../../utils/clipboard';

export default function HomeDiscoveryConsole({
  setContentType,
  resultLayout,
  setResultLayout,
  mood,
  setMood,
  titleQuery,
  setTitleQuery,
  titleSearchRef,
  searchScope,
  setSearchScope,
  isBusy,
  handleSearch,
  pushToast,
  selectedGenres,
  recommendations,
  isLoading,
  setSelectedGenres,
  setSelectedProviders,
  setMinRating,
  setAdvancedFilters,
  minRating,
  advancedFilters,
  handleClearFilters,
  showFilters,
  setShowFilters,
  activeFilterCount,
  genres,
  handleGenreClick,
  selectedProviders,
  handleProviderToggle,
  providerCatalog,
}) {
  const onSelectPlaylist = ({ genres: plGenres, name, customFilters }) => {
    if (customFilters) {
      setMood(customFilters.mood || '');
      setContentType(customFilters.contentType || 'all');
      setSelectedGenres(customFilters.selectedGenres || []);
      setSelectedProviders(customFilters.selectedProviders || []);
      setMinRating(customFilters.minRating || 0);
      setAdvancedFilters(customFilters.advancedFilters || {});
    } else {
      setSelectedGenres(plGenres);
      setMood(name);
    }
    setTimeout(() => handleSearch(), 0);
  };

  return (
    <section className="discovery-console">
      <div className="discovery-console-head">
        <div>
          <p className="details-kicker">Refine</p>
          <h3>{mood ? `Results for “${mood}”` : 'Browse the feed'}</h3>
        </div>
        <div className="result-layout-toggle" role="group" aria-label="Result layout">
          <button
            type="button"
            className={`result-layout-btn ${resultLayout === 'poster' ? 'active' : ''}`}
            aria-pressed={resultLayout === 'poster'}
            onClick={() => setResultLayout('poster')}
          >
            🎞 Poster Grid
          </button>
          <button
            type="button"
            className={`result-layout-btn ${resultLayout === 'rows' ? 'active' : ''}`}
            aria-pressed={resultLayout === 'rows'}
            onClick={() => setResultLayout('rows')}
          >
            📜 Cinematic List
          </button>
        </div>
      </div>

      <div className="title-search" aria-busy={isBusy}>
        <label htmlFor="title-search-input">Search titles</label>
        <input
          ref={titleSearchRef}
          id="title-search-input"
          type="text"
          value={titleQuery}
          onChange={e => setTitleQuery(e.target.value)}
          placeholder="Search movies or TV"
        />
        <div className="search-scope-toggle" role="group" aria-label="Search scope">
          <button
            type="button"
            className={searchScope === 'within' ? 'active' : ''}
            onClick={() => setSearchScope('within')}
            aria-pressed={searchScope === 'within'}
          >
            Search within mood results
          </button>
          <button
            type="button"
            className={searchScope === 'all' ? 'active' : ''}
            onClick={() => setSearchScope('all')}
            aria-pressed={searchScope === 'all'}
          >
            Search all
          </button>
        </div>
      </div>

      <div className="search-container">
        <button className="secondary-button" type="button" onClick={handleSearch} disabled={isBusy}>
          {isBusy ? 'Searching…' : 'Refresh Results'}
        </button>
        <button
          className="secondary-button"
          type="button"
          aria-label="Copy shareable link"
          onClick={async () => {
            try {
              await copyToClipboard(window.location.href);
              pushToast({
                icon: '🔗',
                title: 'Link copied',
                message: 'Shareable link copied to clipboard.',
                duration: 2600,
              });
            } catch {
              console.error('Copy link failed');
              pushToast({
                icon: '⚠️',
                title: 'Copy failed',
                message: 'Your browser blocked clipboard access.',
                variant: 'error',
                duration: 4000,
              });
            }
          }}
        >
          🔗 Copy Link
        </button>
      </div>

      {recommendations.length === 0 && !isLoading && (
        <MoodPlaylists onSelectPlaylist={onSelectPlaylist} />
      )}

      <button className="filters-toggle" type="button" onClick={() => setShowFilters(!showFilters)}>
        {showFilters ? '✕ Hide Filters' : '⚙️ Filter & Sort'}
        {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
      </button>

      {showFilters && (
        <div className={`filters-wrapper ${activeFilterCount > 0 ? 'has-filters' : ''}`}>
          <div className="genre-filters">
            <h3>Genres:</h3>
            <div className="genre-buttons">
              {genres.map(genre => (
                <button
                  key={genre.id}
                  type="button"
                  className={selectedGenres.includes(genre.id) ? 'active' : ''}
                  onClick={() => handleGenreClick(genre.id)}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
          <StreamingFilter
            selectedProviders={selectedProviders}
            onToggle={handleProviderToggle}
            providers={providerCatalog.length > 0 ? providerCatalog : undefined}
            label="My Services"
          />
          <RatingFilter minRating={minRating} onRatingChange={setMinRating} />
          <AdvancedFilters filters={advancedFilters} onFiltersChange={setAdvancedFilters} />
          <div className="filter-actions" style={{ gridColumn: 'span 2', textAlign: 'center' }}>
            <button className="text-button" type="button" onClick={handleClearFilters}>
              🧹 Clear All Filters
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
