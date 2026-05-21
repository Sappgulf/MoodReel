export const CURATED_COLLECTIONS = Object.freeze([
  {
    id: 'under-90',
    label: 'Under 90 min',
    description: 'Fast, low-commitment picks for weeknights.',
    mood: 'tight paced comfort',
    filters: { runtime: 'short', sortBy: 'popularity.desc' },
  },
  {
    id: 'visual-comfort',
    label: 'Visual comfort',
    description: 'Warm, stylish titles for an easy couch reset.',
    mood: 'cozy visually beautiful',
    filters: { runtime: 'any', sortBy: 'vote_average.desc' },
  },
  {
    id: 'crowd-night',
    label: 'Crowd night',
    description: 'Popular crowd-pleasers with enough ratings to trust.',
    mood: 'fun crowd pleasing',
    filters: { runtime: 'medium', sortBy: 'popularity.desc' },
  },
  {
    id: 'hidden-gems',
    label: 'Hidden gems',
    description: 'Higher-rated picks outside the obvious first row.',
    mood: 'hidden gem',
    filters: { runtime: 'any', sortBy: 'vote_average.desc' },
  },
]);

export const HUMAN_MOOD_PRESETS = Object.freeze([
  {
    id: 'fried',
    label: 'Mentally fried',
    mood: 'low effort comfort funny',
    constraints: ['low-commitment', 'under-90', 'streaming-now'],
  },
  {
    id: 'date',
    label: 'Date night',
    mood: 'date night warm stylish romantic',
    constraints: ['streaming-now', 'high-rating', 'no-horror'],
  },
  {
    id: 'win',
    label: 'Need a win',
    mood: 'uplifting triumphant feel good',
    constraints: ['high-rating', 'low-commitment'],
  },
  {
    id: 'comfort',
    label: 'Background comfort',
    mood: 'cozy familiar comfort comedy',
    constraints: ['low-commitment', 'streaming-now', 'family-friendly'],
  },
  {
    id: 'feel',
    label: 'Make me feel something',
    mood: 'emotional beautiful moving drama',
    constraints: ['high-rating'],
  },
  {
    id: 'chaos',
    label: 'Chaos mode',
    mood: 'weird wild unpredictable late night',
    constraints: ['wild-card', 'hidden-gem'],
  },
]);

export const DECISION_FEEDBACK = Object.freeze([
  { id: 'too-long', label: 'Too long' },
  { id: 'too-dark', label: 'Too dark' },
  { id: 'seen-it', label: 'Seen it' },
  { id: 'not-vibe', label: 'Not my vibe' },
  { id: 'need-lighter', label: 'Need lighter' },
  { id: 'more-obscure', label: 'More obscure' },
]);

export const REROLL_INTENTS = Object.freeze([
  { id: 'shorter', label: 'Shorter' },
  { id: 'lighter', label: 'More fun' },
  { id: 'stranger', label: 'Weirder' },
  { id: 'acclaimed', label: 'More acclaimed' },
  { id: 'available', label: 'Only streamable' },
]);
