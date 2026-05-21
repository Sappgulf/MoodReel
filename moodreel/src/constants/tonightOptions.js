export const RUNTIME_OPTIONS = Object.freeze([
  { value: 0, label: 'Any length', searchRuntime: 'any' },
  { value: 90, label: '90 min or less', searchRuntime: 'short' },
  { value: 120, label: 'About 2 hours', searchRuntime: 'medium' },
  { value: 150, label: 'Epic is fine', searchRuntime: 'long' },
]);

export const WATCHING_CONTEXTS = Object.freeze([
  { id: 'solo', label: 'Solo', mood: 'personal thoughtful absorbing' },
  { id: 'date', label: 'Date', mood: 'date night warm stylish romantic' },
  { id: 'family', label: 'Family', mood: 'family friendly funny warm' },
  { id: 'friends', label: 'Friends', mood: 'crowd pleasing funny energetic' },
]);

export const RISK_OPTIONS = Object.freeze([
  { id: 'safe', label: 'Safer' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'adventurous', label: 'More adventurous' },
]);
