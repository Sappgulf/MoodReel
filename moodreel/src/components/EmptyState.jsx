import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Pre-defined empty state variants for common scenarios
 */
export const EMPTY_STATE_PRESETS = {
  watchlist: {
    icon: '📋',
    title: 'Your watchlist is empty',
    description: 'Start discovering movies and save your favorites to build the list.',
    actionText: 'Discover Movies',
    actionLink: '/',
  },
  search: {
    icon: '🔍',
    title: 'No results found',
    description: 'Try another mood, clear a filter, or widen the search scope.',
    actionText: 'Explore Moods',
    actionLink: '/',
  },
  favorites: {
    icon: '❤️',
    title: 'No favorites yet',
    description: 'Heart the movies you love to save them here.',
    actionText: 'Discover Movies',
    actionLink: '/',
  },
  achievements: {
    icon: '🏆',
    title: 'No achievements yet',
    description: 'Start exploring to unlock your first achievement!',
    actionText: 'Start Exploring',
    actionLink: '/',
  },
  stats: {
    icon: '📊',
    title: 'No stats yet',
    description: 'Start discovering and saving movies to unlock your stats dashboard.',
    actionText: 'Start Exploring',
    actionLink: '/',
  },
  calendar: {
    icon: '📅',
    title: 'No mood history',
    description: 'Your mood searches will appear here as soon as you start exploring.',
    actionText: 'Search by Mood',
    actionLink: '/',
  },
  watchHistory: {
    icon: '👀',
    title: 'No watch history',
    description: 'Movies you view will appear here.',
    actionText: 'Discover Movies',
    actionLink: '/',
  },
  network: {
    icon: '📡',
    title: "You're offline",
    description: 'Check your connection and try again.',
    actionText: 'Retry',
    actionLink: null,
  },
};

/**
 * Reusable component for empty states
 */
function EmptyState({
  icon,
  title,
  description,
  actionLink,
  actionText,
  onActionClick,
  variant,
  children,
}) {
  // Support preset variants
  const preset = variant ? EMPTY_STATE_PRESETS[variant] : null;
  const finalIcon = icon || preset?.icon || '📭';
  const finalTitle = title || preset?.title || 'Nothing here yet';
  const finalDescription = description || preset?.description || 'Start by adding some content.';
  const finalActionLink = actionLink !== undefined ? actionLink : preset?.actionLink || '/';
  const finalActionText = actionText || preset?.actionText || 'Get Started';

  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-state-icon">{finalIcon}</div>
      <h3 className="empty-state-title">{finalTitle}</h3>
      <p className="empty-state-description">{finalDescription}</p>
      {children}
      {finalActionLink !== null ? (
        finalActionLink.startsWith('/') ? (
          <Link to={finalActionLink} className="empty-state-action">
            {finalActionText}
          </Link>
        ) : (
          <a href={finalActionLink} className="empty-state-action">
            {finalActionText}
          </a>
        )
      ) : onActionClick ? (
        <button type="button" onClick={onActionClick} className="empty-state-action">
          {finalActionText}
        </button>
      ) : null}
    </div>
  );
}

export default React.memo(EmptyState);
