# 🎬 MoodReel

> **Discover films that match your mood** — a feature-rich movie discovery app with personalized recommendations, gamification, and a premium UI.

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green)](https://web.dev/progressive-web-apps/)
[![TMDB](https://img.shields.io/badge/Powered%20by-TMDB-yellow)](https://www.themoviedb.org/)

## ✨ Features

### 🎯 Discovery
- **Mood-based search** — Type "cozy rainy day" or "need a good cry" and get relevant movies
- **Emoji quick-pick** — Tap mood emojis (😊😱💕🚀) for instant genre filtering
- **Surprise Me** — Random trending movie for the indecisive
- **Time-based suggestions** — Morning = uplifting, Evening = date night, Late night = thriller
- **Advanced filters** — Year range, runtime, minimum rating
- **Mood combinations** — Select multiple genres for blended results
- **Search history** — Recent searches shown as clickable chips

### 📱 Mobile Experience
- **Swipe cards** — Tinder-style swipe right to save, left to pass
- **Pull-to-refresh** — Swipe down to reload recommendations
- **Haptic feedback** — Vibration on swipe actions
- **Keyboard shortcuts** — Press `?` to see all shortcuts
- **PWA installable** — Add to home screen for app-like experience
- **Onboarding tour** — First-time welcome with feature highlights

### ❤️ Watchlist
- **Save movies** — Build your personal watchlist with one tap
- **Mark as watched** — Track what you've seen vs. what's on your list
- **Sorting** — Sort by date added, rating, title, or watched status
- **Filter by status** — Show all, watched only, or to-watch only
- **Notes** — Add personal notes to any saved movie
- **Random picker** — "Pick for Me" when you can't decide
- **Matchmaker** — Paste a friend's list to find movies in common
- **Export/Import** — Copy to clipboard or backup as JSON file
- **Personalized recs** — "Because you saved X..." similar movie suggestions

### 🏆 Achievements
8 unlockable badges with progress tracking:
- 🎬 First Save • 🎥 Movie Buff (10 saves) • 📺 Binge Watcher (5 TV shows)
- 😱 Horror Fan • 💕 Hopeless Romantic • 🔥 Trendsetter
- 📅 Consistent (5-day streak) • ⭐ Critic (rate 5 movies)

### 📊 Analytics
- **Stats dashboard** — Total saved, avg ratings, top moods
- **Mood calendar** — 30-day visualization of your mood searches
- **Genre breakdown** — See patterns in your taste

### 🎥 Movie Details
- **Trailer playback** — Watch YouTube trailers in fullscreen modal
- **Streaming providers** — See where to watch (Netflix, Hulu, etc.)
- **Cast & crew** — Top 6 cast members with photos
- **Similar movies** — "You might also like" recommendations
- **User ratings** — Rate and write personal reviews

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone and navigate
cd moodreel

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your TMDB API key

# Start development server
npm start
```

The app will open at http://localhost:3000

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_TMDB_API_KEY` | ❌ Optional | Your own TMDB API key. If not set, uses shared key with rate limiting. |

### Rate Limiting

The app includes a shared TMDB API key with **rate limiting** for fair usage:
- **Regular users**: 30 requests per minute
- **Admin users**: Unlimited (no rate limiting)

#### Enable Admin Mode (Unlimited Access)
Open browser console and run:
```javascript
localStorage.setItem('moodreel-admin', 'true')
```

Then refresh the page. To disable:
```javascript
localStorage.removeItem('moodreel-admin')
```

> 💡 **Tip**: You can also provide your own TMDB API key via `.env` to bypass rate limiting entirely.

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server at http://localhost:3000 |
| `npm run build` | Create production build in `/build` |
| `npm test` | Run Jest test suite (26 tests) |
| `npm run eject` | Eject from CRA (irreversible) |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage --watchAll=false

# Run specific test file
npm test -- useWatchlist.test.js
```

### Test Coverage
- `useWatchlist.test.js` — 15 tests for watchlist operations
- `moodParser.test.js` — 11 tests for mood-to-genre parsing

---

## 🏗️ Architecture

```
src/
├── index.js              # React 18 createRoot entry
├── App.js                # Routes + global state + shortcuts
├── App.css               # ~3800 lines premium CSS
├── index.css             # CSS reset + variables
│
├── components/           # 17 reusable UI components
│   ├── MovieCard.js      # 3D parallax poster card
│   ├── SwipeCard.js      # Tinder-style swipe interface
│   ├── EmojiPicker.js    # Mood emoji grid with particles
│   ├── TrailerModal.js   # YouTube trailer playback
│   ├── Confetti.js       # Canvas celebration effect
│   └── ...more
│
├── pages/                # 6 route pages
│   ├── Home.js           # Main discovery interface
│   ├── MovieDetails.js   # Movie info + trailer + cast
│   ├── Watchlist.js      # Saved movies with sorting/filtering
│   ├── Achievements.js   # Badge grid with progress
│   ├── Stats.js          # Watch analytics dashboard
│   └── MoodCalendar.js   # 30-day mood history
│
├── hooks/                # 6 custom React hooks
│   ├── useWatchlist.js   # Watchlist + watched + export/import
│   ├── useAchievements.js# 8 badges + tracking
│   ├── useMoodHistory.js # Search history + timestamps
│   ├── useRatings.js     # Per-movie star ratings
│   ├── useTheme.js       # Dark/light toggle
│   └── useSounds.js      # Audio feedback
│
└── utils/                # Utility modules
    └── moodParser.js     # Mood-to-genre mapping
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `?` | Show shortcuts modal |
| `D` | Toggle dark/light theme |
| `M` | Toggle sound effects |
| `←` `→` | Swipe left/right (mobile mode) |
| `Enter` | Search with current mood |
| `Esc` | Close modals |

---

## 📱 PWA Installation

On mobile Chrome/Safari:
1. Visit the app
2. Tap "Add to Home Screen" prompt (or ⋮ menu → Install)
3. Launch from home screen for full-screen experience

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
npx vercel --prod
```

The repo includes `vercel.json` with proper SPA routing config.

### Other Platforms
```bash
npm run build
# Deploy the /build folder to any static host
```

---

## 🔧 Troubleshooting

### "No movies loading" / Blank recommendations
- **Cause**: Missing or invalid TMDB API key
- **Fix**: Ensure `REACT_APP_TMDB_API_KEY` is set in `.env` file
- **Verify**: Check browser console for API errors

### "Tests failing with localStorage errors"
- **Cause**: Missing test setup
- **Fix**: Ensure `src/setupTests.js` exists with localStorage mocks

### PWA not installing
- **Cause**: Not served over HTTPS or already installed
- **Fix**: Deploy to HTTPS host (Vercel, Netlify) for install prompts

### Build warnings about browserslist
- **Cause**: Outdated browser data
- **Fix**: Run `npx update-browserslist-db@latest`

### Achievement not unlocking after rating
- **Cause**: Fixed in latest version (was missing trackRating integration)
- **Fix**: Pull latest code - achievements now properly track ratings

---

## 🔑 Tech Stack

- **React 18** with hooks
- **React Router 7** for navigation
- **Axios** for API calls
- **TMDB API** for movie data
- **localStorage** for persistence
- **Web Audio API** for sounds
- **Canvas API** for confetti
- **Service Worker** for offline support
- **CSS Variables** for theming

---

## 📄 License

MIT © 2024
