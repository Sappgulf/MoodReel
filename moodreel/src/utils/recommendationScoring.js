const num = (v, d = 0) => (Number.isFinite(v) ? v : d);

export function scoreRecommendation(item, context = {}) {
  let score = num(item.vote_average) * 8 + Math.min(num(item.popularity) / 10, 20);
  const reasons = [];
  const key = `${item.media_type || 'movie'}:${item.id}`;

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
  if ((context.watchlistKeys || new Set()).has(key)) score += 6;
  if ((context.favoriteKeys || new Set()).has(key)) score += 6;
  if (num(item.vote_average) >= 7.5) reasons.push('High audience rating');

  if ((context.dislikedKeys || new Set()).has(key)) {
    score -= 50;
    reasons.push('You disliked similar picks');
  }
  if ((context.watchedKeys || new Set()).has(key)) {
    score -= 35;
    reasons.push('Already watched');
  }
  if ((context.hiddenKeys || new Set()).has(key)) score -= 80;

  const availableMinutes = context.availableMinutes;
  if (availableMinutes > 0) {
    const runtime = num(item.runtime);
    const isTv = item.media_type === 'tv' || Boolean(item.name && !item.title);
    if (runtime > 0 && !isTv) {
      if (runtime <= availableMinutes + 15) {
        score += 12;
        reasons.push('Fits your available time');
      } else if (runtime > availableMinutes + 45) {
        score -= 18;
      }
    } else if (isTv && availableMinutes <= 90) {
      score += 6;
      reasons.push('Good for a shorter session (series)');
    }
  }

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
