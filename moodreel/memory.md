# memory.md — MoodReel Project Memory (STRICT)

## What This App Is

MoodReel is a cinematic decision engine for picking what to watch. Users describe a vibe, set constraints (runtime, services, context, rating), and get three ranked picks: **Safe Bet**, **Best Match**, and **Wild Card** — each with plain-language explanations.

The repo contains two clients:

- **Web PWA** in `moodreel/` (Vite + React)
- **Native iOS app** in `MoodReel-iOS/` (SwiftUI, Keychain-backed API keys)

There is **no backend**. TMDB is called directly from the client.

## Core User Flows (Do Not Break)

1. Tonight Mode / Discover → vibe + constraints → three decision picks.
2. Search → relevant results with sane ranking.
3. Open a title → detail view (metadata + trailer when available).
4. Watchlist add/remove → persists after refresh.
5. Taste profile (like/dislike) → influences ranking and can hide disliked titles.
6. Shareable links → URL encodes mood/search/filters for easy sharing.

## Frontend Stack (Verified)

- Build: Vite 8
- Framework: React 18
- Router: React Router DOM 7
- HTTP: Axios
- Styling: Vanilla CSS / Cinema Noir design system
- State: React hooks + custom hooks in `src/hooks/`
- Testing: Vitest, React Testing Library, Playwright E2E
- PWA: `public/service-worker.js` registered from `src/App.jsx` (production only)

Run web commands from `moodreel/`:

```bash
npm run dev
npm run verify   # lint + unit tests + build + bundle size gate
npm run test:e2e
```

## Data Source (Verified)

- Primary API: TMDB (The Movie Database)
- Base URL: `https://api.themoviedb.org/3` (override with `VITE_TMDB_BASE_URL`)
- API key resolution (in order): `VITE_TMDB_API_KEY` env → `window.__MOODREEL_TMDB_API_KEY__` bootstrap → user key in localStorage (Profile)
- Legacy alias: `REACT_APP_TMDB_*` still supported in `apiClient.js` during migration
- **Never hardcode TMDB keys in source.** Never commit `.env`.
- **Client-side keys are public in production bundles** — use TMDB domain-restricted keys for deploys.
- iOS stores keys in Keychain via `APIKeyStore` in `MoodReel-iOS/MoodReel/Config/TMDBConfig.swift`.

Endpoints used:

- Search: `/search/movie`, `/search/tv`
- Discover: `/discover/movie`, `/discover/tv`
- Details: `/{mediaType}/{id}` (with `append_to_response=similar,videos,credits,watch/providers`)
- Trending: `/trending/all/day`
- Watch providers: `/{mediaType}/{id}/watch/providers`, `/watch/providers/{mediaType}`
- Person credits: `/person/{id}/combined_credits`

Rules:

- Normalize API responses in `searchService.js`.
- Treat all API fields as optional; UI must handle null/undefined with fallbacks.

## Ranking / Tonight Mode (Verified)

- Pure scoring logic: `src/utils/recommendationScoring.js` (unit-tested)
- Mood → genre mapping: `src/utils/moodParser.js`
- Three slots: Safe Bet, Best Match, Wild Card with confidence + reason text
- Dedicated routes: `/` (Discover), `/tonight` (Tonight Mode)

## Persistence

- Storage helper: `src/storage/safeStorage.js` with schema versioning
- Key registry: `src/storage/storageKeys.js`
- Notable keys:
  - `moodreel-watchlist`: saved movies/TV
  - `moodreel-watch-history`: browsing history
  - `moodreel-mood-history`: recent mood searches
  - `moodreel-search-persistent-cache`: cached API results (TTL + eviction)
  - `moodreel-achievements`: unlocked badges
  - `moodreel-user-ratings`: user star ratings
  - `moodreel-playlists`: custom vibe saves
  - `moodreel_profile`: user profile data
  - `moodreel-region`: watch provider region
  - `moodreel-my-services`: selected streaming services
  - `moodreel-taste-profile`: liked/disliked IDs
  - `moodreel-tmdb-api-key`: user-supplied TMDB key (excluded from privacy export)
  - `moodreel-tonight-preferences`: persisted Tonight Mode constraints (vibe, runtime, context, risk, etc.)

## Architecture

- UI components: `src/components/`
- Route pages: `src/pages/`
- API + normalization: `src/services/` (`apiClient.js`, `searchService.js`)
- Shared hooks: `src/hooks/`
- Pure utils: `src/utils/`
- Shared types (contracts only): `src/types.ts` — app source is `.js`/`.jsx`

## UI Principles

- Cinema Noir aesthetics (dark mode, glassmorphism)
- Gold and crimson accents
- Unified skeleton loading
- Keyboard accessibility: focus rings, ARIA labels, semantic HTML, skip links

## Known Pitfalls

- API rate limits (TMDB): tracked via `rateLimiter.js`
- Missing assets: poster/backdrop/trailer fallbacks required
- Request storms: `AbortController` + in-flight deduplication in services
- Service worker: register only from `App.jsx` — do not duplicate in `index.html`
- Bundle gate: entry chunk must stay under 380 KiB raw / 150 KiB gzip (`npm run bundle:check`)
