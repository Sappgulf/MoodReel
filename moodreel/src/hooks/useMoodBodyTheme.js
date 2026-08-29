import { useEffect } from 'react';

const MOOD_CLASSES = ['mood-romantic', 'mood-thriller', 'mood-happy', 'mood-classic'];

/**
 * Keywords that map a free-text mood onto one of the body-level mood themes.
 * The first entry whose keywords appear in the mood wins.
 */
const MOOD_MATCHERS = [
  { className: 'mood-romantic', keywords: ['romance', 'love', 'date'] },
  { className: 'mood-thriller', keywords: ['thrill', 'scary', 'horror', 'dark'] },
  { className: 'mood-happy', keywords: ['happy', 'uplift', 'fun', 'comedy'] },
  { className: 'mood-classic', keywords: ['classic', 'old', 'noir', 'retro'] },
];

/** The mood theme a given mood string resolves to, or `null` for no theme. */
export function resolveMoodThemeClass(mood) {
  if (!mood) return null;
  const moodLower = mood.toLowerCase();
  const match = MOOD_MATCHERS.find(matcher =>
    matcher.keywords.some(keyword => moodLower.includes(keyword))
  );
  return match?.className ?? null;
}

/**
 * Tint the whole page to match the active mood by toggling a class on <body>.
 * This is a DOM side effect on an external element, which is why it lives in
 * an effect rather than in render.
 */
export function useMoodBodyTheme(mood) {
  useEffect(() => {
    const { body } = document;
    body.classList.remove(...MOOD_CLASSES);

    const themeClass = resolveMoodThemeClass(mood);
    if (!themeClass) return undefined;

    body.classList.add(themeClass);
    return () => body.classList.remove(...MOOD_CLASSES);
  }, [mood]);
}

export default useMoodBodyTheme;
