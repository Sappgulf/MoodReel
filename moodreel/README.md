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
- **Keyboard shortcuts** — Press `?` to see all shortcuts, `D` theme, `M` sounds
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

**Confetti celebration** on every unlock! 🎉

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

### 🎨 Visual Polish
- **3D parallax cards** — Tilt effect on hover
- **Particle animations** — Burst effects on mood selection
- **Confetti** — Canvas celebration on achievements
- **Dark/light theme** — Smooth 0.3s transition
- **Custom scrollbar** — Themed thin scrollbar
- **Skeleton loading** — Shimmer placeholders during load
- **Sound effects** — Optional audio feedback (mutable)
- **Scroll-to-top** — Smooth scroll on page navigation

---

## 🏗️ Architecture

```
src/
├── components/           # 16 reusable UI components
│   ├── MovieCard.js      # 3D parallax poster card
│   ├── SwipeCard.js      # Tinder-style swipe interface
│   ├── EmojiPicker.js    # Mood emoji grid with particles
│   ├── TrailerModal.js   # YouTube trailer playback
│   ├── Confetti.js       # Canvas celebration effect
│   ├── OnboardingModal.js # First-time welcome tour
│   ├── KeyboardShortcutsModal.js # Shortcuts help
│   ├── AdvancedFilters.js # Year/runtime filter panel
│   ├── StarRating.js     # 5-star rating input
│   ├── InstallPrompt.js  # PWA install banner
│   ├── AchievementToast.js # Unlock notification
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
│   ├── useAchievements.js # 8 badges + tracking
│   ├── useMoodHistory.js # Search history + timestamps
│   ├── useRatings.js     # Per-movie star ratings
│   ├── useTheme.js       # Dark/light toggle
│   └── useSounds.js      # Audio feedback
│
├── App.js                # Routes + global shortcuts
├── App.css               # 3600+ lines of premium CSS
└── index.js              # Entry point

public/
├── manifest.json         # PWA manifest
├── service-worker.js     # Offline caching
└── index.html            # Meta tags + SW registration
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
- **Canvas API** for confetti
- **Service Worker** for offline support
- **CSS Variables** for theming (no Tailwind)

---

## 📄 License

MIT © 2024
