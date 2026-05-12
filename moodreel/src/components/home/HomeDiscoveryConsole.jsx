import { useCallback, useState } from 'react';
import MoodPlaylists from '../MoodPlaylists';
import StreamingFilter from '../StreamingFilter';
import RatingFilter from '../RatingFilter';
import AdvancedFilters from '../AdvancedFilters';
import { copyToClipboard } from '../../utils/clipboard';
import {
  getBackdropUrl,
  getDisplayOverview,
  getDisplayTitle,
  getReleaseYear,
} from '../../utils/mediaUtils';

export default function HomeDiscoveryConsole({
  contentType,
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
  featuredItem,
}) {
  const [isExportingCard, setIsExportingCard] = useState(false);

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

  const drawRoundedRect = useCallback((ctx, x, y, w, h, r) => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }, []);

  const wrapText = useCallback((ctx, text, x, y, maxWidth, lineHeight) => {
    const words = String(text || '').split(' ');
    let line = '';
    let cursorY = y;

    words.forEach(word => {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        ctx.fillText(line, x, cursorY);
        cursorY += lineHeight;
        line = word;
        return;
      }
      line = candidate;
    });

    if (line) {
      ctx.fillText(line, x, cursorY);
    }

    return cursorY;
  }, []);

  const loadCanvasImage = useCallback(src => {
    return new Promise(resolve => {
      if (!src) {
        resolve(null);
        return;
      }

      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }, []);

  const handleExportCard = useCallback(async () => {
    if (!window?.document) return;

    setIsExportingCard(true);
    try {
      const width = 1080;
      const height = 1350;
      const scale = Math.min(2, window.devicePixelRatio || 1);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      canvas.width = width * scale;
      canvas.height = height * scale;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(scale, scale);

      const shareFeaturedItem = featuredItem || recommendations[0];
      const topPicks = recommendations.slice(0, 5).filter(Boolean);
      const now = new Date();
      const date = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const moodLabel = mood || 'Any mood';
      const scopeLabel =
        contentType === 'all' ? 'All titles' : contentType === 'tv' ? 'TV only' : 'Movies only';

      const filterParts = [];
      if (selectedGenres.length) filterParts.push(`${selectedGenres.length} genres`);
      if (selectedProviders.length) filterParts.push(`${selectedProviders.length} services`);
      if (minRating > 0) filterParts.push(`${minRating}+ minimum rating`);
      if (advancedFilters?.sortBy && advancedFilters.sortBy !== 'popularity.desc') {
        filterParts.push(`Sorted ${advancedFilters.sortBy.replace('.', ' ')}`);
      }
      const filterText = filterParts.length
        ? filterParts.join(' · ')
        : 'Default discovery settings';

      const backgroundGradient = ctx.createLinearGradient(0, 0, 0, height);
      backgroundGradient.addColorStop(0, '#0f1624');
      backgroundGradient.addColorStop(0.45, '#111a2a');
      backgroundGradient.addColorStop(1, '#090d14');
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 215, 0, 0.18)';
      ctx.fillRect(0, 0, width, 14);

      drawRoundedRect(ctx, 44, 32, width - 88, height - 64, 28);
      ctx.fillStyle = 'rgba(18, 26, 42, 0.92)';
      ctx.fill();

      ctx.fillStyle = '#f3f4f6';
      ctx.font = '700 52px "Trebuchet MS", "Segoe UI", sans-serif';
      ctx.fillText('MoodReel', 72, 108);
      ctx.font = '300 20px "Trebuchet MS", "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
      ctx.fillText('Mood snapshot card', 76, 140);

      const panelX = 72;
      const panelY = 178;
      const panelW = width - 144;
      const panelH = 390;

      ctx.save();
      drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 20);
      ctx.clip();

      const imageUrl =
        getBackdropUrl(
          shareFeaturedItem?.backdrop_path || shareFeaturedItem?.poster_path,
          'w780'
        ) || getBackdropUrl(null);
      const heroImage = await loadCanvasImage(imageUrl);

      if (heroImage) {
        const scaleW = Math.max(panelW / heroImage.width, panelH / heroImage.height);
        const drawW = heroImage.width * scaleW;
        const drawH = heroImage.height * scaleW;
        const dx = panelX - (drawW - panelW) / 2;
        const dy = panelY - (drawH - panelH) / 2;
        ctx.globalAlpha = 0.78;
        ctx.drawImage(heroImage, dx, dy, drawW, drawH);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
        ctx.font = '700 26px "Trebuchet MS", "Segoe UI", sans-serif';
        ctx.fillText('No featured artwork available', panelX + 40, panelY + panelH / 2);
      }

      const overlay = ctx.createLinearGradient(0, panelY, 0, panelY + panelH);
      overlay.addColorStop(0, 'rgba(0, 0, 0, 0)');
      overlay.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = overlay;
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.restore();

      const contentX = panelX + 28;
      let contentY = 606;
      const columnGap = 22;
      const rightColumnX = 540;
      const maxWidth = panelW - 56;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '600 18px "Trebuchet MS", "Segoe UI", sans-serif';
      ctx.fillText(`Mood: ${moodLabel}`, contentX, contentY);
      contentY += 22;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '500 15px "Trebuchet MS", "Segoe UI", sans-serif';
      ctx.fillText(
        `Scope: ${scopeLabel} · ${searchScope === 'all' ? 'global search' : 'mood search'}`,
        contentX,
        contentY
      );
      contentY += 18;
      ctx.fillText(`Filters: ${filterText}`, contentX, contentY);
      contentY += 30;

      if (shareFeaturedItem) {
        ctx.fillStyle = '#fff';
        ctx.font = '700 28px "Trebuchet MS", "Segoe UI", sans-serif';
        contentY = wrapText(
          ctx,
          `Featured: ${getDisplayTitle(shareFeaturedItem)}`,
          contentX,
          contentY,
          maxWidth,
          34
        );
        contentY += 8;
        ctx.font = '400 15px "Trebuchet MS", "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.74)';
        const year = getReleaseYear(shareFeaturedItem);
        const summary = `${year ? `${year} · ` : ''}${
          shareFeaturedItem.media_type === 'tv' ? 'Series' : 'Film'
        }`;
        ctx.fillText(summary, contentX, contentY);
        contentY += 22;
        const overview = getDisplayOverview(shareFeaturedItem);
        contentY =
          wrapText(ctx, overview, contentX, contentY, rightColumnX - contentX - columnGap, 22) + 4;
      }

      const listTitleY = contentY + 24;
      ctx.fillStyle = '#fff';
      ctx.font = '700 22px "Trebuchet MS", "Segoe UI", sans-serif';
      ctx.fillText('Top picks now', contentX, listTitleY);
      ctx.font = '500 15px "Trebuchet MS", "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.78)';

      let listY = listTitleY + 24;
      if (topPicks.length === 0) {
        ctx.fillText(
          'No recommendations loaded yet. Hit refresh to generate a list.',
          contentX,
          listY
        );
      } else {
        topPicks.forEach((item, index) => {
          const title = getDisplayTitle(item);
          const year = getReleaseYear(item);
          const rating = item.vote_average ? `${item.vote_average.toFixed(1)} ★` : 'rating pending';
          const line = `${index + 1}. ${title}${year ? ` (${year})` : ''} — ${rating}`;
          ctx.fillText(`${line.slice(0, 90)}${line.length > 90 ? '…' : ''}`, contentX, listY);
          listY += 28;
        });
      }

      drawRoundedRect(ctx, 72, height - 96, width - 144, 64, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.74)';
      ctx.font = '500 14px "Trebuchet MS", "Segoe UI", sans-serif';
      ctx.fillText(`Generated from MoodReel • ${date}`, 100, height - 52);
      ctx.fillText(window.location.href, rightColumnX, height - 52);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(result => {
          if (!result) {
            reject(new Error('Share card could not be generated.'));
            return;
          }
          resolve(result);
        }, 'image/png');
      });

      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const slug = (mood || contentType || 'discover')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 24);
      anchor.href = href;
      anchor.download = `moodreel-${slug}-${Date.now()}.png`;
      anchor.rel = 'noopener';
      anchor.setAttribute('data-testid', 'share-card-download');
      anchor.style.position = 'fixed';
      anchor.style.left = '-9999px';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(href);

      pushToast({
        icon: '🖼️',
        title: 'Share card exported',
        message: 'Your MoodReel social preview card was saved.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Share card export failed:', error);
      pushToast({
        icon: '⚠️',
        title: 'Share card failed',
        message: 'We could not export a share card from this browser state.',
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setIsExportingCard(false);
    }
  }, [
    contentType,
    featuredItem,
    loadCanvasImage,
    minRating,
    mood,
    pushToast,
    recommendations,
    searchScope,
    selectedGenres.length,
    selectedProviders.length,
    advancedFilters?.sortBy,
    wrapText,
    drawRoundedRect,
  ]);

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
          className="secondary-button share-card-btn"
          type="button"
          onClick={handleExportCard}
          disabled={isExportingCard || isBusy}
          aria-label="Export mood snapshot share card"
        >
          {isExportingCard ? '🖼️ Generating…' : '🖼️ Export Card'}
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
