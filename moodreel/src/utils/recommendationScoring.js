import { getMediaKey } from './mediaKeys';

const num = (v, d = 0) => (Number.isFinite(v) ? v : d);

function getRuntimeMinutes(item) {
  const runtime = item?.runtime ?? item?.episode_run_time?.[0];
  return Number.isFinite(runtime) ? runtime : null;
}

export function scoreRecommendation(item, context = {}) {
  let score = num(item.vote_average) * 8 + Math.min(num(item.popularity) / 10, 20);
  const reasons = [];
  const key = getMediaKey(item);

  if ((context.selectedGenres || []).some(g => (item.genre_ids || []).includes(g))) {
    score += 18;
    reasons.push('Matches your current mood');
  }
  if ((context.providerMatches || new Set()).has(key)) {
    score += 14;
    reasons.push('Available on one of your services');
  }
  if ((context.likedKeys || new Set()).has(key)) {
    score += 16;
    reasons.push('Similar to titles you liked');
  }
  if ((context.watchlistKeys || new Set()).has(key)) {
    score += 6;
    reasons.push('On your watchlist');
  }
  if ((context.favoriteKeys || new Set()).has(key)) score += 6;
  if (num(item.vote_average) >= 7.5) reasons.push('High audience rating');

  const availableMinutes = context.availableMinutes;
  const runtime = getRuntimeMinutes(item);
  if (availableMinutes && runtime) {
    if (runtime <= availableMinutes) {
      score += 12;
      reasons.push('Fits your available time');
    } else if (runtime > availableMinutes + 25) {
      score -= 18;
      reasons.push('Longer than your time window');
    }
  }

  if ((context.dislikedKeys || new Set()).has(key)) {
    score -= 50;
    reasons.push('You disliked similar picks');
  }
  if ((context.watchedKeys || new Set()).has(key)) {
    score -= 35;
    reasons.push('Already watched');
  }
  if ((context.hiddenKeys || new Set()).has(key)) score -= 80;

  return { score, reasons: reasons.slice(0, 3) };
}

export function rankRecommendations(items, context = {}) {
  return [...items]
    .map(item => ({ item, ...scoreRecommendation(item, context) }))
    .sort((a, b) => b.score - a.score);
}

export function explainRecommendation(item, context = {}) {
  const { reasons } = scoreRecommendation(item, context);
  return reasons.length ? reasons.join(' • ') : 'Good overall fit for tonight';
}
