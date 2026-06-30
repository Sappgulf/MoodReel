/**
 * Dynamic OG image generator for shared vibe URLs.
 *
 * Usage: GET /api/og-vibe?title=Cozy%20Sunday&mood=cozy&genres=35%2C10751&emoji=%E2%98%95
 *
 * Returns an SVG document with `Content-Type: image/svg+xml` so it
 * works as an og:image for most modern social platforms (Twitter,
 * LinkedIn, Slack, iMessage). Facebook still requires PNG; if that
 * becomes a target we'd need a renderer like @vercel/og.
 *
 * The SVG mirrors the in-app brand: gold on dark, display-serif
 * title, small mood pill.
 */

const WIDTH = 1200;
const HEIGHT = 630;

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(str, max) {
  if (!str) return '';
  if (str.length <= max) return str;
  return `${str.slice(0, max - 1).trimEnd()}…`;
}

const GENRE_NAMES = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

function renderGenres(genreIds) {
  if (!genreIds) return [];
  return genreIds
    .split(',')
    .map(id => GENRE_NAMES[Number(id)])
    .filter(Boolean)
    .slice(0, 4);
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { title = 'A MoodReel vibe', mood = '', genres = '', emoji = '🎬' } = req.query;

  const cleanTitle = truncate(escapeXml(title), 56);
  const cleanMood = escapeXml(mood);
  const cleanEmoji = escapeXml(emoji);
  const moodPill = cleanMood ? `Mood · ${cleanMood}` : 'MoodReel · Shareable Vibe';
  const genreChips = renderGenres(genres);

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const chips = genreChips
    .map(
      (name, idx) =>
        `<g transform="translate(${idx * 168}, 0)"><rect x="0" y="0" width="152" height="46" rx="23" fill="rgba(255,215,0,0.10)" stroke="rgba(255,215,0,0.45)"/><text x="76" y="30" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="600" fill="#FFD700">${escapeXml(name)}</text></g>`
    )
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#0c1017"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.15" cy="0.05" r="0.7">
      <stop offset="0%" stop-color="rgba(255,215,0,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,215,0,0)"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#F5A623"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  <g opacity="0.08" fill="#FFD700">
    <circle cx="1080" cy="120" r="180"/>
    <circle cx="1100" cy="540" r="220"/>
  </g>

  <!-- Brand row -->
  <g transform="translate(80, 80)">
    <text x="0" y="0" font-family="'Playfair Display', Georgia, serif" font-size="34" font-weight="700" fill="#FFD700">🎬 MoodReel</text>
  </g>
  <g transform="translate(80, 130)">
    <rect x="0" y="0" width="${Math.max(180, moodPill.length * 9 + 40)}" height="42" rx="21" fill="rgba(255,215,0,0.12)" stroke="rgba(255,215,0,0.45)"/>
    <text x="20" y="28" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="600" fill="#FFD700">${moodPill}</text>
  </g>

  <!-- Emoji glyph -->
  <g transform="translate(${WIDTH - 240}, 60)">
    <text x="0" y="200" font-family="'Apple Color Emoji', 'Segoe UI Emoji', sans-serif" font-size="240" text-anchor="end">${cleanEmoji}</text>
  </g>

  <!-- Title -->
  <g transform="translate(80, 320)">
    <text x="0" y="0" font-family="'Playfair Display', Georgia, serif" font-size="92" font-weight="700" fill="url(#gold)" letter-spacing="-2">${cleanTitle}</text>
  </g>

  <!-- Subtitle -->
  <g transform="translate(80, 410)">
    <text x="0" y="0" font-family="Inter, system-ui, sans-serif" font-size="28" fill="#bcc3d3" font-weight="400">Discover films that match your mood.</text>
  </g>

  <!-- Genre chips -->
  <g transform="translate(80, 500)">
    ${chips || '<text x="0" y="30" font-family="Inter, system-ui, sans-serif" font-size="22" fill="#8b93a4">Any genre</text>'}
  </g>

  <!-- Footer -->
  <g transform="translate(80, ${HEIGHT - 50})">
    <text x="0" y="0" font-family="Inter, system-ui, sans-serif" font-size="20" fill="#8b93a4">moodreel.app · Share this vibe with anyone</text>
  </g>
</svg>`;

  res.status(200).send(svg);
}
