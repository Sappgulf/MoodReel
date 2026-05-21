import { normalizeProviderList } from './mediaUtils';

export function getPersonInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

export function formatStarRating(rating) {
  const stars = Math.round(rating / 2);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

export function buildProviderSections(providers) {
  if (!providers) return [];

  const groups = {
    stream: normalizeProviderList(providers.flatrate || []),
    rent: normalizeProviderList(providers.rent || []),
    buy: normalizeProviderList(providers.buy || []),
  };

  return [
    { key: 'stream', label: 'Stream', action: 'Stream on', providers: groups.stream },
    { key: 'rent', label: 'Rent', action: 'Rent on', providers: groups.rent },
    { key: 'buy', label: 'Buy', action: 'Buy on', providers: groups.buy },
  ].filter(section => section.providers.length > 0);
}

export function computeTonightVerdict({
  content,
  providerSections,
  myServices,
  mediaType,
  isInWatchlist,
  isWatched,
}) {
  if (!content) return null;

  const streamSection = providerSections.find(section => section.key === 'stream');
  const streamProviders = streamSection?.providers || [];
  const matchingProviders = streamProviders.filter(provider => myServices.includes(provider.id));
  const runtimeMinutes = content.runtime || content.episode_run_time?.[0] || 0;
  const runtimeFit = runtimeMinutes > 0 && runtimeMinutes <= 120;
  const ratingFit = (content.vote_average || 0) >= 7;
  const watchlistFit = isInWatchlist(content.id, mediaType);
  const watched = isWatched(content.id, mediaType);
  const score = Math.min(
    98,
    52 +
      (matchingProviders.length > 0 ? 22 : streamProviders.length > 0 ? 10 : 0) +
      (runtimeFit ? 10 : 0) +
      (ratingFit ? 10 : 0) +
      (watchlistFit ? 6 : 0) -
      (watched ? 24 : 0)
  );
  const reasons = [];

  if (matchingProviders.length > 0) {
    reasons.push(
      `Streams on ${matchingProviders
        .slice(0, 2)
        .map(provider => provider.name)
        .join(', ')}`
    );
  } else if (streamProviders.length > 0) {
    reasons.push('Streaming availability exists, but not on your selected services yet');
  } else {
    reasons.push('No streaming provider data found for your region');
  }
  if (runtimeFit) reasons.push('Runtime fits a normal night');
  if (ratingFit) reasons.push('Strong TMDB rating signal');
  if (watched) reasons.push('Already watched, so it should not lead Tonight Mode');

  return {
    score,
    label: score >= 84 ? 'Watch tonight' : score >= 70 ? 'Good backup' : 'Maybe later',
    reasons,
  };
}

export function computeWhyYouMightLikeIt({
  content,
  director,
  isLimitedDetails,
  mediaType,
  statusFor,
  watchHistory,
}) {
  if (!content) return [];

  const reasons = [];
  const status = statusFor(content.id, mediaType);

  if (status === 'liked') {
    reasons.push(
      'You marked this as a liked title, so similar picks will stay closer to this lane.'
    );
  }
  if (isLimitedDetails) {
    reasons.push(
      'This page is using saved card data while live details are temporarily unavailable.'
    );
  }
  if (director) {
    reasons.push(
      `Directed by ${director.name}, with cast and similar-title context used for future ranking.`
    );
  }

  const sameTypeViews = watchHistory.filter(item => item.media_type === mediaType).length;
  if (sameTypeViews > 1) {
    reasons.push(
      `You have opened ${sameTypeViews} ${mediaType === 'tv' ? 'series' : 'movies'} recently, so this format is boosted.`
    );
  }
  if (content.vote_average >= 8) {
    reasons.push('TMDB viewers rate this strongly.');
  }
  if (reasons.length === 0) {
    reasons.push('It matched the discovery filters that brought you here.');
  }

  return reasons.slice(0, 3);
}

export function computeTasteIntel({ cast, director, reviewText, userReview, watchHistory }) {
  const viewedCast = new Set(watchHistory.flatMap(item => item.cast || []));
  const viewedDirectors = new Set(watchHistory.flatMap(item => item.directors || []));
  const castMatches = cast.filter(person => viewedCast.has(person.name)).slice(0, 3);
  const directorMatch = director && viewedDirectors.has(director.name) ? director.name : '';
  const normalizedReview = (userReview || reviewText || '').toLowerCase();
  const positiveWords = ['love', 'great', 'fun', 'beautiful', 'favorite', 'excellent'];
  const criticalWords = ['slow', 'boring', 'bad', 'weak', 'confusing', 'disappointing'];
  const positiveHits = positiveWords.filter(word => normalizedReview.includes(word)).length;
  const criticalHits = criticalWords.filter(word => normalizedReview.includes(word)).length;

  let reviewSentiment = 'No review notes yet';
  if (normalizedReview) {
    if (positiveHits > criticalHits) reviewSentiment = 'Your notes lean positive';
    else if (criticalHits > positiveHits) reviewSentiment = 'Your notes flag some friction';
    else reviewSentiment = 'Your notes are balanced';
  }

  return {
    castMatches,
    directorMatch,
    reviewSentiment,
    hasSignals: castMatches.length > 0 || Boolean(directorMatch) || Boolean(normalizedReview),
  };
}
