import EmojiPicker from '../EmojiPicker';
import MoodPlaylists from '../MoodPlaylists';
import StreamingFilter from '../StreamingFilter';
import RatingFilter from '../RatingFilter';
import AdvancedFilters from '../AdvancedFilters';
import { copyToClipboard } from '../../utils/clipboard';

export default function HomeDiscoveryConsole({
  contentType,
  setContentType,
  setRecommendations,
  setHasSearched,
  resultLayout,
  setResultLayout,
  mood,
  setMood,
  moodInputRef,
  recentMoods,
  playSound,
  titleQuery,
  setTitleQuery,
  titleSearchRef,
  searchScope,
  setSearchScope,
  isBusy,
  handleSearch,
  pushToast,
  handleEmojiSelect,
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
      <div className="content-toggle-tabs" role="group" aria-label="Content type">
        {['all', 'movie', 'tv'].map(type => (
          <button
            key={type}
            type="button"
            className={`content-tab ${contentType === type ? 'active' : ''}`}
            aria-pressed={contentType === type}
            onClick={() => {
              setContentType(type);
              setRecommendations([]);
              setHasSearched(false);
            }}
          >
            {type === 'all' ? '🎬 All' : type === 'movie' ? '🎥 Movies' : '📺 TV'}
          </button>
        ))}
      </div>

      <div className="result-layout-toggle" role="group" aria-label="Result layout">
        <button
          type="button"
          className={`result-layout-btn ${resultLayout === 'poster' ? 'active' : ''}`}
          onClick={() => setResultLayout('poster')}
        >
          🎞 Poster Grid
        </button>
        <button
          type="button"
          className={`result-layout-btn ${resultLayout === 'rows' ? 'active' : ''}`}
          onClick={() => setResultLayout('rows')}
        >
          📜 Cinematic List
        </button>
      </div>

      <div className="mood-selector">
        <label htmlFor="mood-search-input" className="mood-input-label">
          How are you feeling?
        </label>
        <div className="mood-input-wrapper">
          <span className="mood-icon" aria-hidden="true">
            ✨
          </span>
          <input
            id="mood-search-input"
            ref={moodInputRef}
            type="text"
            value={mood}
            onChange={e => setMood(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="What's your mood tonight?"
          />
          {mood && (
            <button
              type="button"
              className="mood-clear-btn"
              onClick={() => setMood('')}
              aria-label="Clear mood"
            >
              ✕
            </button>
          )}
        </div>
        {recentMoods.length > 0 && !mood && (
          <div className="recent-moods">
            <span className="recent-moods-label">Recent:</span>
            {recentMoods.slice(0, 5).map((recentMood, idx) => (
              <button
                key={idx}
                type="button"
                className="recent-mood-chip"
                onClick={() => {
                  setMood(recentMood);
                  playSound('pop');
                }}
              >
                {recentMood}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="title-search">
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
        <button className="primary-button" type="button" onClick={handleSearch} disabled={isBusy}>
          {isBusy ? 'Searching…' : 'Get Recommendations'}
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

      <EmojiPicker onSelect={handleEmojiSelect} selectedGenres={selectedGenres} />

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
