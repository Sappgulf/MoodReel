const MOOD_PATTERNS = [
  {
    match: /romance|love|date|cozy/i,
    icon: '💕',
    title: 'No romance in the reel yet',
    description: 'Widen the year range or try “date night” with fewer filters.',
  },
  {
    match: /thrill|scary|horror|dark|intense/i,
    icon: '😱',
    title: 'Nothing scary enough… yet',
    description: 'Loosen services or drop rating — we’ll find something that bites.',
  },
  {
    match: /happy|uplift|fun|comedy|laugh/i,
    icon: '😄',
    title: 'The laughs are hiding',
    description: 'Try “comedy” alone or switch to Any (OR) for genres.',
  },
  {
    match: /classic|noir|retro|nostalg/i,
    icon: '🎞️',
    title: 'No classics in this cut',
    description: 'Expand the year window or clear a genre — golden age awaits.',
  },
  {
    match: /adventure|action|excited|electric/i,
    icon: '⚡',
    title: 'No adrenaline hits',
    description: 'Search again with fewer services or a broader mood.',
  },
  {
    match: /dreamy|melanchol|sad|reflect/i,
    icon: '🌙',
    title: 'Quiet pool — no matches',
    description: 'Soften filters or try a single mood keyword.',
  },
];

const DEFAULT = {
  icon: '✨',
  title: 'No results found',
  description: 'Try a different mood, remove a filter chip, or clear everything for a fresh reel.',
};

export function getMoodEmptyState(mood = '') {
  if (!mood?.trim()) return DEFAULT;
  const hit = MOOD_PATTERNS.find(p => p.match.test(mood));
  return hit || DEFAULT;
}
