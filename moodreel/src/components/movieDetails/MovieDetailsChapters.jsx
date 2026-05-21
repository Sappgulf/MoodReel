import { Link } from 'react-router-dom';

import MovieCard from '../MovieCard';
import MediaImage from '../MediaImage';
import { getPersonInitials } from '../../utils/movieDetailsUtils';
import { getDisplayTitle } from '../../utils/mediaUtils';

export default function MovieDetailsChapters({
  title,
  cast,
  trailer,
  region,
  providerSections,
  similar,
  mediaType,
  isInWatchlist,
  toggleWatchlist,
  isWatched,
  toggleWatched,
  like,
  dislike,
  statusFor,
  onActorClick,
}) {
  return (
    <>
      <section className="cast-section details-section" aria-labelledby="cast-heading">
        <header className="details-section-head">
          <p className="details-kicker">Chapter One</p>
          <h3 id="cast-heading">Cast</h3>
        </header>
        {cast.length > 0 ? (
          <div className="cast-grid cast-grid-strip" role="list" aria-label="Cast members">
            {cast.map(person => (
              <button
                key={person.id}
                className="cast-member clickable"
                type="button"
                onClick={() => onActorClick(person)}
                aria-label={`${person.name} — ${person.character || 'Cast and crew member'}`}
              >
                {person.profile_path ? (
                  <span className="cast-photo-shell" aria-hidden="true">
                    <span className="cast-initials">{getPersonInitials(person.name)}</span>
                    <MediaImage
                      path={person.profile_path}
                      size="w185"
                      alt=""
                      className="cast-photo"
                      loading="eager"
                    />
                  </span>
                ) : (
                  <span className="cast-photo-placeholder" aria-hidden="true">
                    {getPersonInitials(person.name) || 'Cast'}
                  </span>
                )}
                <div className="cast-info">
                  <p className="cast-name">{person.name}</p>
                  <p className="cast-character">{person.character}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="filmography-empty">Cast list is not available for this title yet.</p>
        )}
      </section>

      <section className="trailer-section details-section" aria-labelledby="trailer-heading">
        <header className="details-section-head">
          <p className="details-kicker">Chapter Two</p>
          <h3 id="trailer-heading">Watch Trailer</h3>
        </header>
        {trailer ? (
          <div className="trailer-container">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title={`${title} trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : (
          <p className="trailer-empty">Trailer unavailable right now.</p>
        )}
      </section>

      <section className="streaming-section details-section" aria-labelledby="providers-heading">
        <header className="details-section-head">
          <p className="details-kicker">Chapter Three</p>
          <h3 id="providers-heading">Where to Watch ({region})</h3>
        </header>
        {providerSections.length > 0 ? (
          <div className="streaming-providers">
            {providerSections.map(section => (
              <div className="provider-group" key={section.key}>
                <h4>{section.label}</h4>
                <ul className="provider-grid" aria-label={`${section.label} providers`}>
                  {section.providers.map(provider => (
                    <li className="provider-card" key={`${section.key}-${provider.id}`}>
                      <MediaImage
                        path={provider.logoPath}
                        size="w92"
                        alt=""
                        title={`${section.action} ${provider.name}`}
                        className="provider-logo"
                        loading="lazy"
                      />
                      <span>{provider.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="providers-empty">No provider data available for this title.</p>
        )}
      </section>

      <section className="similar-movies details-section" aria-labelledby="similar-heading">
        <header className="details-section-head">
          <p className="details-kicker">Chapter Four</p>
          <h3 id="similar-heading">You Might Also Like</h3>
        </header>
        {similar.length > 0 ? (
          <div
            className="similar-movies-grid similar-movies-grid-strip filmstrip"
            role="list"
            aria-label="Similar titles to watch next"
          >
            {similar.map(item => (
              <article className="filmstrip-item" role="listitem" key={item.id}>
                <MovieCard
                  movie={{ ...item, media_type: mediaType }}
                  isInWatchlist={isInWatchlist(item.id, mediaType)}
                  onToggleWatchlist={toggleWatchlist}
                  isWatched={isWatched(item.id, mediaType)}
                  onToggleWatched={toggleWatched}
                  displayMode="row"
                  mediaType={mediaType}
                  onLike={like}
                  onDislike={dislike}
                  tasteStatus={statusFor(item.id, mediaType)}
                />
              </article>
            ))}
          </div>
        ) : (
          <p className="filmography-empty">No similar titles are available for this title.</p>
        )}
      </section>
    </>
  );
}

export function ActorFilmographyModal({
  selectedActor,
  actorLoading,
  actorError,
  actorFilmography,
  actorDialogRef,
  actorDialogCloseRef,
  onClose,
  onRetryActor,
}) {
  if (!selectedActor) return null;

  return (
    <div className="filmography-overlay" onClick={onClose}>
      <div
        className="filmography-modal"
        ref={actorDialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filmography-heading"
        onClick={e => e.stopPropagation()}
      >
        <button
          ref={actorDialogCloseRef}
          className="filmography-close"
          type="button"
          aria-label="Close filmography"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="filmography-header">
          {selectedActor.profile_path && (
            <MediaImage
              path={selectedActor.profile_path}
              size="w185"
              alt={selectedActor.name}
              className="filmography-actor-photo"
            />
          )}
          <div>
            <h3 id="filmography-heading">{selectedActor.name}</h3>
            <p className="filmography-subtitle">Filmography</p>
          </div>
        </div>

        {actorLoading ? (
          <div className="filmography-loading">Loading filmography...</div>
        ) : actorError ? (
          <div className="filmography-empty">
            <p>{actorError}</p>
            <button type="button" className="review-edit-btn" onClick={onRetryActor}>
              Retry
            </button>
          </div>
        ) : actorFilmography.length > 0 ? (
          <div className="filmography-grid">
            {actorFilmography.map(credit => (
              <Link
                key={`${credit.id}-${credit.media_type}`}
                to={`/${credit.media_type === 'tv' ? 'tv' : 'movie'}/${credit.id}`}
                className="filmography-item"
                onClick={onClose}
              >
                {credit.poster_path ? (
                  <MediaImage
                    path={credit.poster_path}
                    size="w154"
                    alt={getDisplayTitle(credit)}
                    className="filmography-poster"
                    loading="lazy"
                  />
                ) : (
                  <div className="filmography-poster-placeholder">🎬</div>
                )}
                <p className="filmography-title">{getDisplayTitle(credit)}</p>
                <p className="filmography-role">{credit.character || credit.job}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="filmography-empty">No other credits found</p>
        )}
      </div>
    </div>
  );
}
