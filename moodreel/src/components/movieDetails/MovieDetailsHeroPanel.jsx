import MediaImage from '../MediaImage';
import ShareButtons from '../ShareButtons';
import ShareableVibeCard from '../ShareableVibeCard';
import StarRating from '../StarRating';
import { formatStarRating } from '../../utils/movieDetailsUtils';
import { getDisplayOverview, getDisplayTitle } from '../../utils/mediaUtils';

export default function MovieDetailsHeroPanel({
  content,
  isTV,
  isLimitedDetails,
  director,
  trailer,
  tasteStatus,
  userRating,
  userReview,
  reviewText,
  setReviewText,
  showReviewForm,
  setShowReviewForm,
  setShowTrailerModal,
  isInWatchlist,
  isWatched,
  mediaType,
  onToggleWatchlist,
  onToggleWatched,
  onLike,
  onDislike,
  onRatingChange,
  onReviewSubmit,
  onNativeShare,
  onRetry,
  onPlayTrailer,
}) {
  const title = getDisplayTitle(content);
  const date = content.release_date || content.first_air_date;
  const year = date ? new Date(date).getFullYear() : '';
  const runtime = content.runtime || content.episode_run_time?.[0];
  const overview = getDisplayOverview(content);
  const tagline = content.tagline ? `“${content.tagline}”` : '';
  const runtimeLabel = runtime ? `${runtime} min` : '';
  const genresText = content.genres?.map(genre => genre.name).join(' • ') || '';
  const ratingText = content.vote_average ? content.vote_average.toFixed(1) : '';
  const seasonLabel =
    isTV && content.number_of_seasons
      ? `${content.number_of_seasons} season${content.number_of_seasons > 1 ? 's' : ''}`
      : '';

  return (
    <section className="movie-details-hero-panel glass-panel">
      <div className="movie-details-header">
        <div className="poster-container">
          <MediaImage path={content.poster_path} alt={`${title} poster`} loading="eager" />
        </div>

        <div className="movie-info">
          <p className="movie-details-eyebrow">{isTV ? 'TV Title' : 'Movie'}</p>
          <h1>{title}</h1>
          {isLimitedDetails && (
            <div className="limited-details-banner" role="status">
              <span>Limited details</span>
              <p>
                Showing saved card data while live TMDB details are unavailable. Watchlist, taste,
                and sharing still work.
              </p>
              <button type="button" className="text-button" onClick={onRetry}>
                Retry live details
              </button>
            </div>
          )}
          {tagline && <p className="movie-tagline">{tagline}</p>}
          <p className="overview">{overview}</p>

          <dl className="movie-facts-strip" aria-label="Quick facts">
            {year && (
              <>
                <dt>Year</dt>
                <dd>{year}</dd>
              </>
            )}
            {runtimeLabel && (
              <>
                <dt>Runtime</dt>
                <dd>{runtimeLabel}</dd>
              </>
            )}
            {seasonLabel && (
              <>
                <dt>Seasons</dt>
                <dd>{seasonLabel}</dd>
              </>
            )}
            {director && (
              <>
                <dt>Director</dt>
                <dd>{director.name}</dd>
              </>
            )}
            {genresText && (
              <>
                <dt>Genres</dt>
                <dd>{genresText}</dd>
              </>
            )}
            {ratingText && (
              <>
                <dt>TMDB</dt>
                <dd>
                  <span className="rating-large" aria-label={`Rating: ${ratingText} out of 10`}>
                    <span className="stars" aria-hidden="true">
                      {formatStarRating(content.vote_average)}
                    </span>
                    <span>{ratingText}</span>
                  </span>
                </dd>
              </>
            )}
          </dl>

          <div className="action-buttons">
            <button
              className="primary-button"
              onClick={onToggleWatchlist}
              aria-pressed={isInWatchlist(content.id, mediaType)}
            >
              {isInWatchlist(content.id, mediaType) ? '❤️ In Watchlist' : '🤍 Add to Watchlist'}
            </button>

            {isInWatchlist(content.id, mediaType) && (
              <button
                className={`watched-btn ${isWatched(content.id, mediaType) ? 'watched' : ''}`}
                onClick={() => onToggleWatched(content.id, mediaType)}
              >
                {isWatched(content.id, mediaType) ? '✅ Watched' : '👁️ Mark as Watched'}
              </button>
            )}

            {trailer && (
              <div className="trailer-actions">
                <button className="trailer-btn" onClick={() => setShowTrailerModal(true)}>
                  ▶️ Watch Trailer
                </button>
                <button
                  className="pip-button"
                  onClick={() => onPlayTrailer(trailer.key, title)}
                  title="Watch in Picture-in-Picture"
                >
                  📍 PiP Mode
                </button>
              </div>
            )}

            <ShareButtons title={title} />
            <button
              type="button"
              className="btn-secondary native-share-btn"
              onClick={onNativeShare}
            >
              Share sheet
            </button>
          </div>

          <ShareableVibeCard item={content} caption="Shareable vibe card" />

          <div className="taste-profile-actions" role="group" aria-label="Taste profile">
            <button
              className={`taste-btn ${tasteStatus === 'liked' ? 'active' : ''}`}
              onClick={() => onLike(content, mediaType)}
              aria-pressed={tasteStatus === 'liked'}
            >
              👍 Like
            </button>
            <button
              className={`taste-btn ${tasteStatus === 'disliked' ? 'active' : ''}`}
              onClick={() => onDislike(content, mediaType)}
              aria-pressed={tasteStatus === 'disliked'}
            >
              👎 Dislike
            </button>
          </div>

          <div className="user-rating-section">
            <h4>Your Rating:</h4>
            <StarRating rating={userRating} onRate={onRatingChange} size="large" />

            {!showReviewForm && !userReview && (
              <button
                type="button"
                className="review-toggle-btn"
                onClick={() => setShowReviewForm(true)}
              >
                ✏️ Write a Review
              </button>
            )}

            {userReview && !showReviewForm && (
              <div className="user-review">
                <p>"{userReview}"</p>
                <button
                  type="button"
                  className="review-edit-btn"
                  onClick={() => setShowReviewForm(true)}
                >
                  Edit
                </button>
              </div>
            )}

            {showReviewForm && (
              <div className="review-form">
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="What did you think of this movie?"
                  rows={3}
                />
                <div className="review-form-actions">
                  <button type="button" onClick={onReviewSubmit}>
                    Save Review
                  </button>
                  <button type="button" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
