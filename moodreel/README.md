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

### 📱 Mobile Experience
- **Swipe cards** — Tinder-style swipe right to save, left to pass
- **Pull-to-refresh** — Swipe down to reload recommendations
- **Haptic feedback** — Vibration on swipe actions
- **Keyboard shortcuts** — Arrow keys for desktop swiping
- **PWA installable** — Add to home screen for app-like experience

### ❤️ Watchlist
- **Save movies** — Build your personal watchlist with one tap
- **Notes** — Add personal notes to any saved movie
- **Random picker** — "Pick for Me" when you can't decide
- **Matchmaker** — Paste a friend's list to find movies in common
- **Export** — Copy formatted watchlist to clipboard
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

### 🎨 Visual Polish
- **3D parallax cards** — Tilt effect on hover
- **Particle animations** — Burst effects on mood selection
- **Dark/light theme** — Toggle with persistence
- **Skeleton loading** — Shimmer placeholders during load
- **Sound effects** — Optional audio feedback (mutable)

---

## 🏗️ Architecture

```
src/
├── components/           # Reusable UI components
│   ├── MovieCard.js      # 3D parallax poster card
│   ├── SwipeCard.js      # Tinder-style swipe interface
│   ├── EmojiPicker.js    # Mood emoji grid with particles
│   ├── AdvancedFilters.js # Year/runtime filter panel
│   ├── StarRating.js     # 5-star rating input
│   ├── StreamingFilter.js # Provider selection
│   ├── RatingFilter.js   # TMDB rating slider  
│   ├── ShareButtons.js   # Social share integration
│   ├── InstallPrompt.js  # PWA install banner
│   ├── AchievementToast.js # Unlock notification
│   ├── Skeleton.js       # Loading placeholders
│   └── ErrorBoundary.js  # Error handling wrapper
│
├── pages/                # Route pages
│   ├── Home.js           # Main discovery interface
│   ├── MovieDetails.js   # Full movie info + cast
│   ├── Watchlist.js      # Saved movies + notes + matchmaker
│   ├── Achievements.js   # Badge grid with progress
│   ├── Stats.js          # Watch analytics dashboard
│   └── MoodCalendar.js   # 30-day mood history
│
├── hooks/                # Custom React hooks
│   ├── useWatchlist.js   # localStorage watchlist + notes
│   ├── useAchievements.js # Badge tracking + stats
│   ├── useMoodHistory.js # Search history + timestamps
│   ├── useRatings.js     # Per-movie star ratings
│   ├── useTheme.js       # Dark/light toggle
│   └── useSounds.js      # Audio feedback
│
├── App.js                # Routes + global providers
├── App.css               # 3000+ lines of premium CSS
└── index.js              # Entry point

public/
├── manifest.json         # PWA manifest
├── service-worker.js     # Offline caching
└── index.html            # Meta tags + SW registration
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Environment Variables (optional)
```
REACT_APP_TMDB_API_KEY=your_api_key
```
A default TMDB key is included for development.

---

## 📱 PWA Installation

On mobile Chrome/Safari:
1. Visit the app
2. Tap "Add to Home Screen" prompt (or ⋮ menu → Install)
3. Launch from home screen for full-screen experience

---

## 🔑 Tech Stack

- **React 18** with hooks
- **React Router** for navigation
- **Axios** for API calls
- **TMDB API** for movie data
- **localStorage** for persistence
- **Web Audio API** for sounds
- **Service Worker** for offline support
- **CSS Variables** for theming (no Tailwind)

---

## 📄 License

MIT © 2024
