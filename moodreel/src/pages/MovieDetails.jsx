import React from 'react';
import { Link } from 'react-router-dom';

import MediaImage from '../components/MediaImage';
import TrailerModal from '../components/TrailerModal';
import ErrorState from '../components/ErrorState';
import { Skeleton } from '../components/Skeleton';
import MovieDetailsHeroPanel from '../components/movieDetails/MovieDetailsHeroPanel';
import MovieDetailsInsights from '../components/movieDetails/MovieDetailsInsights';
import MovieDetailsChapters, {
  ActorFilmographyModal,
} from '../components/movieDetails/MovieDetailsChapters';
import { useMovieDetails } from '../hooks/useMovieDetails';
import { getDisplayTitle } from '../utils/mediaUtils';

function MovieDetailsLoading() {
  return (
    <main role="main" className="immersive-main">
      <div className="movie-details-backdrop">
        <Skeleton height="100%" className="backdrop-img" />
      </div>
      <Link to="/" className="back-button">
        ← Back to Discover
      </Link>
      <div className="movie-details">
        <section className="movie-details-hero-panel glass-panel">
          <div className="movie-details-header">
            <div className="poster-container">
              <Skeleton height="100%" />
            </div>
            <div className="movie-info">
              <Skeleton height="2.5rem" width="75%" style={{ marginBottom: '1rem' }} />
              <Skeleton height="1rem" width="55%" style={{ marginBottom: '1.5rem' }} />
              <div className="movie-facts-strip">
                {[1, 2, 3, 4].map(i => (
                  <div key={i}>
                    <Skeleton height="0.7rem" width="2.5rem" />
                    <Skeleton height="0.9rem" width="4rem" />
                  </div>
                ))}
              </div>
              <Skeleton height="5rem" style={{ marginBottom: '1.5rem' }} />
              <div className="action-buttons">
                <Skeleton height="2.6rem" width="8rem" />
                <Skeleton height="2.6rem" width="7rem" />
                <Skeleton height="2.6rem" width="7rem" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MovieDetails() {
  const details = useMovieDetails();

  if (details.error) {
    return (
      <main role="main">
        <Link to="/" className="back-button">
          ← Back to Discover
        </Link>
        <ErrorState
          title="Couldn't load details"
          message={details.error}
          onRetry={details.handleRetry}
        />
      </main>
    );
  }

  if (details.isLoading) {
    return <MovieDetailsLoading />;
  }

  if (!details.content) {
    return (
      <main role="main">
        <Link to="/" className="back-button">
          ← Back to Discover
        </Link>
        <ErrorState
          title="Couldn't load details"
          message="This title did not return usable details. Please try again or pick another result."
          onRetry={details.handleRetry}
        />
      </main>
    );
  }

  const { content } = details;
  const title = getDisplayTitle(content);
  const tasteStatus = details.statusFor(content.id, details.mediaType);
  const backdropSources = [
    content.backdrop_path
      ? { path: content.backdrop_path, type: 'backdrop', size: 'original' }
      : null,
    content.poster_path ? { path: content.poster_path, type: 'poster', size: 'w780' } : null,
  ].filter(Boolean);

  return (
    <main role="main" className="immersive-main">
      <div className="movie-details-backdrop">
        <MediaImage
          type="backdrop"
          path={content.backdrop_path || content.poster_path}
          size={content.backdrop_path ? 'original' : 'w780'}
          sources={backdropSources}
          alt=""
          className="backdrop-img"
          loading="eager"
        />
      </div>

      <Link to="/" className="back-button">
        ← Back to Discover
      </Link>

      <article className="movie-details">
        <MovieDetailsHeroPanel
          content={content}
          isTV={details.isTV}
          isLimitedDetails={details.isLimitedDetails}
          director={details.director}
          trailer={details.trailer}
          tasteStatus={tasteStatus}
          userRating={details.userRating}
          userReview={details.userReview}
          reviewText={details.reviewText}
          setReviewText={details.setReviewText}
          showReviewForm={details.showReviewForm}
          setShowReviewForm={details.setShowReviewForm}
          setShowTrailerModal={details.setShowTrailerModal}
          isInWatchlist={details.isInWatchlist}
          isWatched={details.isWatched}
          mediaType={details.mediaType}
          onToggleWatchlist={details.handleToggleWatchlist}
          onToggleWatched={details.toggleWatched}
          onLike={details.like}
          onDislike={details.dislike}
          onRatingChange={details.handleRatingChange}
          onReviewSubmit={details.handleReviewSubmit}
          onNativeShare={details.handleNativeShare}
          onRetry={details.handleRetry}
          onPlayTrailer={details.playTrailer}
        />

        <MovieDetailsInsights
          tonightVerdict={details.tonightVerdict}
          whyYouMightLikeIt={details.whyYouMightLikeIt}
          tasteIntel={details.tasteIntel}
          onPostWatchReaction={details.handlePostWatchReaction}
        />

        <MovieDetailsChapters
          title={title}
          cast={details.cast}
          trailer={details.trailer}
          region={details.region}
          providerSections={details.providerSections}
          similar={details.similar}
          mediaType={details.mediaType}
          isInWatchlist={details.isInWatchlist}
          toggleWatchlist={details.toggleWatchlist}
          isWatched={details.isWatched}
          toggleWatched={details.toggleWatched}
          like={details.like}
          dislike={details.dislike}
          statusFor={details.statusFor}
          onActorClick={details.handleActorClick}
        />
      </article>

      {details.showTrailerModal && details.trailer && (
        <TrailerModal
          videoKey={details.trailer.key}
          onClose={() => details.setShowTrailerModal(false)}
        />
      )}

      <ActorFilmographyModal
        selectedActor={details.selectedActor}
        actorLoading={details.actorLoading}
        actorError={details.actorError}
        actorFilmography={details.actorFilmography}
        actorDialogRef={details.actorDialogRef}
        actorDialogCloseRef={details.actorDialogCloseRef}
        onClose={details.closeActorModal}
        onRetryActor={() => details.handleActorClick(details.selectedActor)}
      />
    </main>
  );
}

export default MovieDetails;
