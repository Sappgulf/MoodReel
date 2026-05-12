import { getDisplayTitle, getReleaseYear } from './mediaUtils';

const FAMILY_GENRES = new Set([16, 10751]);
const HORROR_GENRES = new Set([27]);
const WILD_GENRES = new Set([14, 878, 9648, 99]);
const CLASSIC_YEAR = 2005;
const NEWER_WINDOW_YEARS = 5;

export const TONIGHT_MODES = [
  {
    id: 'easy-win',
    label: 'Easy win',
    eyebrow: 'Low friction',
    mood: 'cozy comfort lighthearted',
    filters: { runtime: 'short', sortBy: 'popularity.desc' },
    minRating: 6.5,
    defaultConstraints: ['low-commitment', 'streaming-now'],
    genreBoosts: [35, 16, 10751],
    textBoosts: ['comfort', 'cozy', 'family', 'funny', 'light', 'warm', 'feel good'],
    description: 'Shorter, safer picks when nobody wants to negotiate for twenty minutes.',
    decisionCopy: 'MoodReel weights low commitment, provider fit, and broad audience signal.',
  },
  {
    id: 'date-night',
    label: 'Date night',
    eyebrow: 'Warm + stylish',
    mood: 'date night romantic visually beautiful',
    filters: { runtime: 'medium', sortBy: 'vote_average.desc' },
    minRating: 6.8,
    defaultConstraints: ['streaming-now', 'high-rating', 'no-horror'],
    genreBoosts: [10749, 18, 35],
    textBoosts: ['love', 'romance', 'beautiful', 'relationship', 'wedding', 'music', 'summer'],
    description: 'Romantic or emotionally polished without turning the night into homework.',
    decisionCopy: 'MoodReel favors warmth, availability, and rating confidence over raw hype.',
  },
  {
    id: 'group-vote',
    label: 'Group vote',
    eyebrow: 'Crowd safe',
    mood: 'fun crowd pleasing adventure comedy',
    filters: { runtime: 'medium', sortBy: 'popularity.desc' },
    minRating: 6.4,
    defaultConstraints: ['streaming-now', 'family-friendly', 'no-horror'],
    genreBoosts: [35, 12, 28, 10751],
    textBoosts: ['team', 'friend', 'adventure', 'party', 'game', 'family', 'mission'],
    description: 'Broad picks that are easier to defend when the couch has opinions.',
    decisionCopy: 'MoodReel boosts high-vote-count, low-risk titles with broad genre appeal.',
  },
  {
    id: 'late-night',
    label: 'Late night',
    eyebrow: 'Moody',
    mood: 'late night tense thriller mystery',
    filters: { runtime: 'any', sortBy: 'vote_average.desc' },
    minRating: 7,
    defaultConstraints: ['high-rating', 'wild-card'],
    genreBoosts: [53, 9648, 27, 878],
    textBoosts: ['mystery', 'secret', 'night', 'crime', 'haunted', 'future', 'survival'],
    description: 'Sharper picks for when you want atmosphere, tension, or a weird left turn.',
    decisionCopy: 'MoodReel looks for stronger craft signals before surfacing the wild card.',
  },
];

export const NIGHT_CONSTRAINTS = [
  {
    id: 'under-90',
    label: 'Under 90',
    description: 'Prefer movies with known runtime under 90 minutes.',
  },
  {
    id: 'streaming-now',
    label: 'Streaming now',
    description: 'Prefer titles available on your selected services.',
  },
  {
    id: 'family-friendly',
    label: 'Family friendly',
    description: 'Boost family and animation, avoid rough horror signals.',
  },
  {
    id: 'no-horror',
    label: 'No horror',
    description: 'Strongly downrank horror titles and scary wording.',
  },
  {
    id: 'hidden-gem',
    label: 'Hidden gem',
    description: 'Prefer strong ratings without blockbuster-level popularity.',
  },
  {
    id: 'high-rating',
    label: 'High rating',
    description: 'Prefer titles with stronger TMDB rating and vote confidence.',
  },
  {
    id: 'newer',
    label: 'Newer',
    description: 'Prefer recent releases from the last few years.',
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Prefer older, proven titles.',
  },
  {
    id: 'low-commitment',
    label: 'Low commitment',
    description: 'Prefer shorter or familiar-feeling picks.',
  },
  {
    id: 'wild-card',
    label: 'Wild card',
    description: 'Allow a less obvious but still defensible left turn.',
  },
];

export function getRecommendationKey(item, fallbackType = 'movie') {
  return `${item?.id ?? 'unknown'}-${item?.media_type || fallbackType}`;
}

function getGenreIds(item) {
  return Array.isArray(item?.genre_ids) ? item.genre_ids : [];
}

function getRuntime(item) {
  const runtime = item?.runtime ?? item?.runtime_minutes;
  return Number.isFinite(runtime) ? runtime : null;
}

function getText(item) {
  return `${item?.title || ''} ${item?.name || ''} ${item?.overview || ''}`.toLowerCase();
}

function getProviderIds(providerData) {
  if (!providerData) return [];
  return ['flatrate', 'rent', 'buy'].flatMap(bucket =>
    Array.isArray(providerData[bucket]) ? providerData[bucket].map(provider => provider.id) : []
  );
}

function hasSelectedProvider(providerData, myServices = []) {
  if (!providerData || myServices.length === 0) return false;
  const providerIds = getProviderIds(providerData);
  return myServices.some(id => providerIds.includes(id));
}

function getYear(item) {
  return Number.parseInt(getReleaseYear(item), 10) || 0;
}

function pushReason(reasons, reason) {
  if (reason && !reasons.includes(reason)) reasons.push(reason);
}

export function scoreRecommendation(item, context = {}) {
  const {
    mode = TONIGHT_MODES[0],
    constraints = [],
    selectedGenres = [],
    providerData = null,
    providerDataByKey = {},
    myServices = [],
    status = 'neutral',
    likedKeys = [],
    dislikedKeys = [],
    savedKeys = [],
    watchedKeys = [],
    watchHistoryKeys = [],
    watchlistGenreCounts = {},
    contentType = 'movie',
    currentYear = new Date().getFullYear(),
  } = context;
  const key = getRecommendationKey(item, contentType);
  const resolvedProviderData = providerData || providerDataByKey[key] || null;
  const constraintSet = new Set(constraints);
  const genreIds = getGenreIds(item);
  const text = getText(item);
  const rating = item?.vote_average || 0;
  const voteCount = item?.vote_count || 0;
  const popularity = item?.popularity || 0;
  const runtime = getRuntime(item);
  const year = getYear(item);
  const reasons = [];
  const penalties = [];
  let score = 0;

  score += Math.min(Math.max(rating - 5.8, 0), 4.2) * 8;
  score += Math.min(Math.log10(Math.max(voteCount, 1)) * 4, 18);
  score += Math.min(Math.log10(Math.max(popularity, 1)) * 3, 12);

  const modeGenreHits = genreIds.filter(genreId => mode.genreBoosts.includes(genreId)).length;
  if (modeGenreHits > 0) {
    score += modeGenreHits * 18;
    pushReason(reasons, `${mode.label} genre match`);
  }

  const selectedGenreHits = genreIds.filter(genreId => selectedGenres.includes(genreId)).length;
  if (selectedGenreHits > 0) {
    score += selectedGenreHits * 8;
    pushReason(reasons, 'matches your selected genres');
  }

  const textHits = mode.textBoosts.filter(token => text.includes(token)).length;
  if (textHits > 0) {
    score += textHits * 4;
    pushReason(reasons, 'story tone fits the mood');
  }

  if (status === 'liked' || likedKeys.includes(key)) {
    score += 60;
    pushReason(reasons, 'you liked it');
  }
  if (status === 'disliked' || dislikedKeys.includes(key)) {
    score -= 90;
    penalties.push('you hid similar taste');
  }

  if (watchedKeys.includes(key) || watchHistoryKeys.includes(key)) {
    score -= 120;
    penalties.push('already watched');
  } else if (savedKeys.includes(key)) {
    score -= 14;
    penalties.push('already saved');
  }

  const availableOnService = hasSelectedProvider(resolvedProviderData, myServices);
  if (availableOnService) {
    score += constraintSet.has('streaming-now') ? 34 : 18;
    pushReason(reasons, 'available on your services');
  } else if (constraintSet.has('streaming-now') && myServices.length > 0 && resolvedProviderData) {
    score -= 22;
    penalties.push('not on selected services');
  }

  if (constraintSet.has('under-90')) {
    if (runtime && runtime <= 90) {
      score += 24;
      pushReason(reasons, 'under 90 minutes');
    } else if (runtime && runtime > 115) {
      score -= 18;
      penalties.push('longer than tonight asked for');
    }
  }

  if (constraintSet.has('low-commitment')) {
    if (runtime && runtime <= 110) {
      score += 12;
      pushReason(reasons, 'low-commitment runtime');
    } else if ((item?.media_type || contentType) === 'movie') {
      score += 5;
      pushReason(reasons, 'single-sitting pick');
    }
  }

  if (constraintSet.has('family-friendly')) {
    if (genreIds.some(genreId => FAMILY_GENRES.has(genreId))) {
      score += 22;
      pushReason(reasons, 'family-friendly signal');
    }
    if (genreIds.some(genreId => HORROR_GENRES.has(genreId))) {
      score -= 55;
      penalties.push('horror conflicts with family-friendly');
    }
  }

  if (constraintSet.has('no-horror')) {
    if (genreIds.some(genreId => HORROR_GENRES.has(genreId))) {
      score -= 75;
      penalties.push('horror filtered down');
    }
    if (/\b(haunted|slasher|demonic|possession|killer|gore)\b/.test(text)) {
      score -= 20;
      penalties.push('scary premise');
    }
  }

  if (constraintSet.has('hidden-gem')) {
    if (rating >= 7 && voteCount >= 250 && popularity < 90) {
      score += 24;
      pushReason(reasons, 'hidden gem profile');
    } else if (popularity > 220) {
      score -= 12;
      penalties.push('too obvious for hidden gem');
    }
  }

  if (constraintSet.has('high-rating')) {
    if (rating >= 7.4) {
      score += 24;
      pushReason(reasons, 'strong rating confidence');
    } else if (rating > 0 && rating < 6.8) {
      score -= 14;
      penalties.push('rating below constraint');
    }
  }

  if (constraintSet.has('newer') && year) {
    if (year >= currentYear - NEWER_WINDOW_YEARS) {
      score += 16;
      pushReason(reasons, 'recent release');
    } else if (year < currentYear - 12) {
      score -= 8;
      penalties.push('older than requested');
    }
  }

  if (constraintSet.has('classic') && year) {
    if (year <= CLASSIC_YEAR) {
      score += year <= 1985 ? 22 : 16;
      pushReason(reasons, 'classic-era pick');
    } else if (year >= currentYear - 3) {
      score -= 8;
      penalties.push('too new for classic mode');
    }
  }

  if (constraintSet.has('wild-card')) {
    const hasWildGenre = genreIds.some(genreId => WILD_GENRES.has(genreId));
    if (hasWildGenre || (popularity < 70 && rating >= 6.8)) {
      score += 18;
      pushReason(reasons, 'defensible wild card');
    }
  }

  score += genreIds.reduce(
    (sum, genreId) => sum + Math.min(watchlistGenreCounts[genreId] || 0, 4) * 3,
    0
  );

  if (reasons.length === 0) {
    if (rating >= 7.2) pushReason(reasons, 'solid audience rating');
    else pushReason(reasons, 'fits the current discovery mix');
  }

  return {
    item,
    key,
    score,
    reasons,
    penalties,
    explanation: buildRecommendationExplanation({ item, reasons, penalties }),
  };
}

export function buildRecommendationExplanation({ item, reasons = [], penalties = [], slotLabel }) {
  const title = getDisplayTitle(item);
  const visibleReasons = reasons.slice(0, 3);
  const prefix = slotLabel ? `${slotLabel}: ` : '';
  const reasonText = visibleReasons.length
    ? visibleReasons.join(', ')
    : 'fits the current discovery mix';
  const penaltyText = penalties.length ? `, with ${penalties[0]} discounted` : '';
  return `${prefix}${title} ranks here because ${reasonText}${penaltyText}.`;
}

export function rankRecommendations(items, context = {}) {
  return [...items]
    .map(item => scoreRecommendation(item, context))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ratingDelta = (b.item.vote_average || 0) - (a.item.vote_average || 0);
      if (ratingDelta !== 0) return ratingDelta;
      const voteDelta = (b.item.vote_count || 0) - (a.item.vote_count || 0);
      if (voteDelta !== 0) return voteDelta;
      return getDisplayTitle(a.item).localeCompare(getDisplayTitle(b.item));
    });
}

export function buildTonightPicks(scorecards, { lockedPickId = '', passedKeys = [] } = {}) {
  const passed = new Set(passedKeys);
  const available = scorecards.filter(scorecard => !passed.has(scorecard.key));
  const locked = lockedPickId ? scorecards.find(scorecard => scorecard.key === lockedPickId) : null;
  const pool = locked ? available.filter(scorecard => scorecard.key !== locked.key) : available;
  const pick = (slot, predicate = () => true) => {
    const match = pool.find(scorecard => predicate(scorecard));
    if (!match) return null;
    const index = pool.findIndex(scorecard => scorecard.key === match.key);
    pool.splice(index, 1);
    return {
      ...match,
      slot,
      slotLabel: slot === 'safe' ? 'Safe Bet' : slot === 'best' ? 'Best Match' : 'Wild Card',
      explanation: buildRecommendationExplanation({
        item: match.item,
        reasons: match.reasons,
        penalties: match.penalties,
        slotLabel: slot === 'safe' ? 'Safe Bet' : slot === 'best' ? 'Best Match' : 'Wild Card',
      }),
    };
  };

  const lockedPick = locked
    ? {
        ...locked,
        slot: 'best',
        slotLabel: 'Best Match',
        explanation: buildRecommendationExplanation({
          item: locked.item,
          reasons: locked.reasons,
          penalties: locked.penalties,
          slotLabel: 'Best Match',
        }),
        locked: true,
      }
    : null;

  const safe =
    pick(
      'safe',
      scorecard =>
        (scorecard.item.vote_average || 0) >= 6.8 && (scorecard.item.vote_count || 0) >= 400
    ) || pick('safe');
  const best = lockedPick || pick('best');
  const wild =
    pick(
      'wild',
      scorecard =>
        (scorecard.item.popularity || 0) < 120 ||
        getGenreIds(scorecard.item).some(genreId => WILD_GENRES.has(genreId))
    ) || pick('wild');

  return [safe, best, wild].filter(Boolean);
}

const recommendationScoring = {
  TONIGHT_MODES,
  NIGHT_CONSTRAINTS,
  getRecommendationKey,
  scoreRecommendation,
  rankRecommendations,
  buildTonightPicks,
  buildRecommendationExplanation,
};

export default recommendationScoring;
