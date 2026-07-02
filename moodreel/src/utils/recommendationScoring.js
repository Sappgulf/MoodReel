import { getDisplayTitle, getReleaseYear } from './mediaUtils';
import { parseMoodToGenres } from './moodParser';

const FAMILY_GENRES = new Set([16, 10751]);
const HORROR_GENRES = new Set([27]);
const WILD_GENRES = new Set([14, 878, 9648, 99]);
const CLASSIC_YEAR = 2005;
const NEWER_WINDOW_YEARS = 5;

const WATCHING_CONTEXT_PROFILES = Object.freeze({
  solo: {
    label: 'Solo',
    genreBoosts: [18, 53, 9648, 878, 99],
    textBoosts: ['quiet', 'personal', 'lonely', 'intimate', 'journey', 'mystery'],
  },
  date: {
    label: 'Date',
    genreBoosts: [10749, 18, 35, 10402],
    textBoosts: ['love', 'romance', 'relationship', 'beautiful', 'music', 'wedding'],
  },
  family: {
    label: 'Family',
    genreBoosts: [16, 10751, 35, 12],
    textBoosts: ['family', 'friendship', 'adventure', 'heartwarming', 'school', 'kids'],
    avoidGenres: [27],
  },
  friends: {
    label: 'Friends',
    genreBoosts: [35, 28, 12, 53],
    textBoosts: ['team', 'friends', 'party', 'game', 'mission', 'heist'],
  },
});

export const TASTE_SETTING_DEFAULTS = Object.freeze({
  contentType: 'any',
  maxRuntime: 0,
  avoidHorror: false,
  hiddenGemBias: false,
  preferredDecades: [],
});

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
  const runtime = item?.runtime ?? item?.runtime_minutes ?? item?.episode_run_time?.[0];
  const numericRuntime = Number(runtime);
  return Number.isFinite(numericRuntime) && numericRuntime > 0 ? numericRuntime : null;
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

function normalizeTextTokens(value) {
  if (!value || typeof value !== 'string') return [];
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 3);
}

function getMediaType(item, fallbackType = 'movie') {
  const rawType = item?.media_type || fallbackType || 'movie';
  if (rawType === 'movies') return 'movie';
  if (rawType === 'tvShows' || rawType === 'series') return 'tv';
  return rawType === 'all' || rawType === 'any' ? item?.media_type || 'movie' : rawType;
}

function matchesContentType(item, contentType = 'all') {
  if (!contentType || contentType === 'all' || contentType === 'any') return true;
  const normalized =
    contentType === 'movies' ? 'movie' : contentType === 'tvShows' ? 'tv' : contentType;
  return getMediaType(item, normalized) === normalized;
}

function getAvailabilityState(providerData, myServices = []) {
  if (!providerData) return 'unknown';
  if (!myServices.length) return 'not-configured';
  return hasSelectedProvider(providerData, myServices) ? 'available' : 'unavailable';
}

function shouldHideByTaste({
  key,
  status,
  dislikedKeys,
  watchedKeys,
  watchHistoryKeys,
  hideDisliked,
  hideWatched,
}) {
  if (hideDisliked && (status === 'disliked' || dislikedKeys.includes(key))) return true;
  if (hideWatched && (watchedKeys.includes(key) || watchHistoryKeys.includes(key))) return true;
  return false;
}

function pushReason(reasons, reason) {
  if (reason && !reasons.includes(reason)) reasons.push(reason);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getConfidenceLabel(scorecard, confidence) {
  if (scorecard.penalties?.includes('already watched')) return 'Freshness warning';
  if (confidence >= 92) return 'Lock this in';
  if (confidence >= 85) return 'Confident match';
  if (confidence >= 76) return 'Good bet';
  if (scorecard.reasons?.includes('defensible wild card')) return 'Risky but worth it';
  return 'Worth a look';
}

function getDecisionTags(scorecard) {
  const tags = [];
  if (scorecard.reasons?.includes('available on your services')) tags.push('Streaming fit');
  if (
    scorecard.reasons?.includes('under 90 minutes') ||
    scorecard.reasons?.includes('low-commitment runtime')
  ) {
    tags.push('Low effort');
  }
  if (scorecard.reasons?.includes('strong rating confidence')) tags.push('Critic-safe');
  if (scorecard.reasons?.includes('hidden gem profile')) tags.push('Hidden gem');
  if (scorecard.reasons?.includes('defensible wild card')) tags.push('Left turn');
  if (scorecard.reasons?.some(reason => reason.includes('genre match'))) tags.push('Mood fit');
  if (tags.length === 0 && (scorecard.item.vote_average || 0) >= 7.5) tags.push('High-rated');
  return tags.slice(0, 4);
}

export function buildScoreBreakdown(scorecard = {}) {
  const item = scorecard.item || {};
  const rating = item.vote_average || 0;
  const voteCount = item.vote_count || 0;
  const reasons = scorecard.reasons || [];
  const penalties = scorecard.penalties || [];
  const confidence = Number(scorecard.confidence);

  return [
    {
      label: 'Mood match',
      value: reasons.some(reason => /mood|vibe|genre|tone/i.test(reason)) ? 'Strong' : 'Learning',
      tone: 'positive',
    },
    {
      label: 'Availability',
      value:
        scorecard.availabilityState === 'available'
          ? 'On your services'
          : scorecard.availabilityState === 'unavailable'
            ? 'Not selected'
            : 'Unknown',
      tone: scorecard.availabilityState === 'available' ? 'positive' : 'neutral',
    },
    {
      label: 'Rating confidence',
      value: rating ? `${rating.toFixed(1)} TMDB · ${voteCount || 0} votes` : 'No rating yet',
      tone: rating >= 7 ? 'positive' : 'neutral',
    },
    {
      label: 'Taste fit',
      value:
        reasons.find(reason => /you|your|preference|liked/i.test(reason)) ||
        penalties.find(reason => /you|your|watched|saved/i.test(reason)) ||
        'More signals needed',
      tone: penalties.some(reason => /disliked|watched|saved|preference/i.test(reason))
        ? 'caution'
        : 'neutral',
    },
    {
      label: 'Decision score',
      value: Number.isFinite(confidence) ? `${Math.round(confidence)}%` : 'Preview',
      tone: Number.isFinite(confidence) && confidence >= 80 ? 'positive' : 'neutral',
    },
  ];
}

function buildDecisionDebate(scorecard, slotLabel) {
  const title = getDisplayTitle(scorecard.item);
  if (slotLabel === 'Safe Bet') {
    return `${title} is the least risky call: strong audience signal with fewer caveats than the rest of the row.`;
  }
  if (slotLabel === 'Wild Card') {
    return `${title} earns the weird slot because it has enough quality signal to justify the curveball.`;
  }
  return `${title} is the best overall match once mood, constraints, services, and taste signals are balanced.`;
}

export function scoreRecommendation(item, context = {}) {
  const {
    mode = TONIGHT_MODES[0],
    moodText = '',
    constraints = [],
    selectedGenres = [],
    providerData = null,
    providerDataByKey = {},
    myServices = [],
    servicesOnly = false,
    status = 'neutral',
    likedKeys = [],
    dislikedKeys = [],
    savedKeys = [],
    watchedKeys = [],
    watchHistoryKeys = [],
    hideDisliked = false,
    hideWatched = false,
    watchlistGenreCounts = {},
    tasteSettings = TASTE_SETTING_DEFAULTS,
    contentType = 'all',
    maxRuntime = 0,
    timeAvailable = 0,
    watchingContext = 'solo',
    riskPreference = 'balanced',
    currentYear = new Date().getFullYear(),
  } = context;
  const itemType = getMediaType(item, contentType);
  const key = getRecommendationKey(item, itemType);
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
  const excluded =
    !matchesContentType(item, contentType) ||
    shouldHideByTaste({
      key,
      status,
      dislikedKeys,
      watchedKeys,
      watchHistoryKeys,
      hideDisliked,
      hideWatched,
    });
  let score = 0;

  if (excluded) {
    if (!matchesContentType(item, contentType)) penalties.push('outside requested format');
    if (hideDisliked && (status === 'disliked' || dislikedKeys.includes(key))) {
      penalties.push('hidden by disliked signal');
    }
    if (hideWatched && (watchedKeys.includes(key) || watchHistoryKeys.includes(key))) {
      penalties.push('hidden because already watched');
    }
  }

  score += Math.min(Math.max(rating - 5.8, 0), 4.2) * 8;
  score += Math.min(Math.log10(Math.max(voteCount, 1)) * 4, 18);
  score += Math.min(Math.log10(Math.max(popularity, 1)) * 3, 12);

  const moodGenreIds = Array.from(new Set([...parseMoodToGenres(moodText), ...selectedGenres]));
  const modeGenreHits = genreIds.filter(genreId => mode.genreBoosts.includes(genreId)).length;
  if (modeGenreHits > 0) {
    score += modeGenreHits * 18;
    pushReason(reasons, `${mode.label} genre match`);
  }

  const moodGenreHits = genreIds.filter(genreId => moodGenreIds.includes(genreId)).length;
  if (moodGenreHits > 0) {
    score += moodGenreHits * 10;
    pushReason(reasons, 'matches the requested vibe');
  }

  const moodTokens = normalizeTextTokens(moodText).slice(0, 8);
  const textHits =
    mode.textBoosts.filter(token => text.includes(token)).length +
    moodTokens.filter(token => text.includes(token)).length;
  if (textHits > 0) {
    score += textHits * 4;
    pushReason(reasons, 'story tone fits the mood');
  }

  const contextProfile = WATCHING_CONTEXT_PROFILES[watchingContext];
  if (contextProfile) {
    const contextGenreHits = genreIds.filter(genreId =>
      contextProfile.genreBoosts.includes(genreId)
    ).length;
    const contextTextHits = contextProfile.textBoosts.filter(token => text.includes(token)).length;
    if (contextGenreHits > 0 || contextTextHits > 0) {
      score += contextGenreHits * 10 + contextTextHits * 3;
      pushReason(reasons, `works for ${contextProfile.label.toLowerCase()} viewing`);
    }
    if (contextProfile.avoidGenres?.some(genreId => genreIds.includes(genreId))) {
      score -= 60;
      penalties.push(`rough fit for ${contextProfile.label.toLowerCase()} viewing`);
    }
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

  const availabilityState = getAvailabilityState(resolvedProviderData, myServices);
  if (availabilityState === 'available') {
    score += constraintSet.has('streaming-now') ? 34 : 18;
    pushReason(reasons, 'available on your services');
  } else if (myServices.length > 0) {
    if (availabilityState === 'unavailable') {
      score -= servicesOnly || constraintSet.has('streaming-now') ? 40 : 16;
      penalties.push('not on selected services');
    } else if (servicesOnly) {
      score -= 10;
      penalties.push('availability unknown');
    }
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
    } else if (itemType === 'movie') {
      score += 5;
      pushReason(reasons, 'single-sitting pick');
    }
  }

  const requestedRuntime = Number(maxRuntime || timeAvailable || 0);
  if (requestedRuntime > 0) {
    if (runtime) {
      if (runtime <= requestedRuntime) {
        score += runtime <= requestedRuntime - 20 ? 12 : 18;
        pushReason(reasons, 'fits the time available');
      } else if (runtime <= requestedRuntime + 15) {
        score -= 6;
        penalties.push("slightly over tonight's time");
      } else {
        score -= 28;
        penalties.push('too long for tonight');
      }
    } else if (itemType === 'movie') {
      score -= 4;
      penalties.push('runtime unknown');
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

  const wantsSafe = riskPreference === 'safe' || riskPreference === 'safer';
  const wantsAdventure = riskPreference === 'adventurous' || riskPreference === 'wild';
  const hasWildGenre = genreIds.some(genreId => WILD_GENRES.has(genreId));
  if (wantsSafe) {
    if (rating >= 7 && voteCount >= 700) {
      score += 18;
      pushReason(reasons, 'safe audience signal');
    }
    if (hasWildGenre && voteCount < 450) {
      score -= 10;
      penalties.push('too risky for safe mode');
    }
  }
  if (wantsAdventure) {
    if (hasWildGenre || (popularity < 80 && rating >= 6.7)) {
      score += 22;
      pushReason(reasons, 'adventurous pick profile');
    }
    if (popularity > 250 && voteCount > 5000) {
      score -= 8;
      penalties.push('very obvious pick');
    }
  }

  score += genreIds.reduce(
    (sum, genreId) => sum + Math.min(watchlistGenreCounts[genreId] || 0, 4) * 3,
    0
  );

  const preferredContentType = tasteSettings.contentType || 'any';
  if (preferredContentType !== 'any') {
    if (preferredContentType === itemType) {
      score += 10;
      pushReason(
        reasons,
        `matches your ${preferredContentType === 'tv' ? 'series' : 'movie'} preference`
      );
    } else {
      score -= 8;
      penalties.push('outside your format preference');
    }
  }

  const tasteMaxRuntime = Number(tasteSettings.maxRuntime || 0);
  if (tasteMaxRuntime > 0 && runtime) {
    if (runtime <= tasteMaxRuntime) {
      score += 10;
      pushReason(reasons, 'within your runtime comfort zone');
    } else if (runtime > tasteMaxRuntime + 20) {
      score -= 14;
      penalties.push('longer than your usual limit');
    }
  }

  if (tasteSettings.avoidHorror && genreIds.some(genreId => HORROR_GENRES.has(genreId))) {
    score -= 60;
    penalties.push('against your no-horror preference');
  }

  if (tasteSettings.hiddenGemBias) {
    if (rating >= 7 && voteCount >= 150 && popularity < 100) {
      score += 12;
      pushReason(reasons, 'fits your hidden-gem bias');
    } else if (popularity > 260) {
      score -= 8;
      penalties.push('too obvious for your taste profile');
    }
  }

  const preferredDecades = Array.isArray(tasteSettings.preferredDecades)
    ? tasteSettings.preferredDecades
    : [];
  if (preferredDecades.length > 0 && year) {
    const decade = Math.floor(year / 10) * 10;
    if (preferredDecades.includes(decade)) {
      score += 8;
      pushReason(reasons, `matches your ${decade}s preference`);
    }
  }

  if (reasons.length === 0) {
    if (rating >= 7.2) pushReason(reasons, 'solid audience rating');
    else pushReason(reasons, 'fits the current discovery mix');
  }

  return {
    item,
    key,
    score,
    excluded,
    availabilityState,
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

export function explainRecommendation(itemOrScorecard, context = {}) {
  const scorecard =
    itemOrScorecard && itemOrScorecard.item
      ? itemOrScorecard
      : scoreRecommendation(itemOrScorecard, context);
  return buildRecommendationExplanation({
    item: scorecard.item,
    reasons: scorecard.reasons,
    penalties: scorecard.penalties,
    slotLabel: context.slotLabel,
  });
}

export function rankRecommendations(items, context = {}) {
  const sorted = [...items]
    .map(item => scoreRecommendation(item, context))
    .filter(scorecard => {
      if (scorecard.excluded) return false;
      if (
        context.servicesOnly &&
        context.myServices?.length > 0 &&
        scorecard.availabilityState === 'unavailable'
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ratingDelta = (b.item.vote_average || 0) - (a.item.vote_average || 0);
      if (ratingDelta !== 0) return ratingDelta;
      const voteDelta = (b.item.vote_count || 0) - (a.item.vote_count || 0);
      if (voteDelta !== 0) return voteDelta;
      return getDisplayTitle(a.item).localeCompare(getDisplayTitle(b.item));
    });

  const topScore = sorted[0]?.score ?? 0;
  const bottomScore = sorted[sorted.length - 1]?.score ?? topScore - 1;
  const spread = Math.max(topScore - bottomScore, 1);

  return sorted.map((scorecard, index) => {
    const relative = (scorecard.score - bottomScore) / spread;
    const confidence = clamp(Math.round(72 + relative * 24 - Math.min(index, 6)), 42, 98);
    return {
      ...scorecard,
      confidence,
      confidenceLabel: getConfidenceLabel(scorecard, confidence),
      tags: getDecisionTags(scorecard),
    };
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
      debateLine: buildDecisionDebate(
        match,
        slot === 'safe' ? 'Safe Bet' : slot === 'best' ? 'Best Match' : 'Wild Card'
      ),
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
        debateLine: buildDecisionDebate(locked, 'Best Match'),
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
  explainRecommendation,
  buildScoreBreakdown,
  TASTE_SETTING_DEFAULTS,
};

export default recommendationScoring;
