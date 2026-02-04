# memory.md — MoodReel Project Memory (STRICT)

## What This App Is
MoodReel is a web app to find movies/TV shows by mood and search, then view details (and trailers when available) and save items to a watchlist.

## Core User Flows (Do Not Break)
1) Mood selection/quiz → recommendations list/grid.
2) Search → relevant results with sane ranking.
3) Open a title → detail view (metadata + trailer if available).
4) Watchlist add/remove → persists after refresh.
5) Taste profile (like/dislike) → influences ranking and can hide disliked titles.
6) Shareable links → URL encodes mood/search/filters for easy sharing.

## Frontend Stack (Verified)
- Framework: React 18 (CRA-based)
- Router: React Router Dom 7
- Styling: Vanilla CSS / Cinema Noir Design System
- State: React Hooks (useState, useEffect, useMemo, useCallback)
- Testing: Jest, React Testing Library, custom smoke script (`scripts/smoke.js`)

## Data Source (Verified)
- Primary API provider: TMDB (The Movie Database)
- Auth: env var key name(s): `REACT_APP_TMDB_API_KEY`
- Note: DO NOT TOUCH. LEAVE IT ALONE. Keep the TMDB API key sourced from environment variables only.
- Base URL(s): `https://api.themoviedb.org/3` (override with `REACT_APP_TMDB_BASE_URL` if needed)
- Endpoints used:
  - Search: `/search/movie`, `/search/tv`
  - Discover: `/discover/movie`, `/discover/tv`
  - Details: `/{mediaType}/{id}` (with `append_to_response=similar,videos,credits,watch/providers`)
  - Trending: `/trending/all/day`
  - Watch providers: `/{mediaType}/{id}/watch/providers`, `/watch/providers/{mediaType}`
  - Person credits: `/person/{id}/combined_credits`
- Rules:
  - Normalize API responses in `searchService.js`.
  - Fields may be missing; UI handles null/undefined with fallbacks.

## Ranking / “Match Score” (Verified)
- Discovery: Driven by genre mapping in `moodParser.js`.
- Sorting: Defaulted to `popularity.desc` via TMDB API.
- Filter: Client-side vote_average filtering for quality assurance.

## Persistence
- Watchlist persistence method: localStorage
- localStorage keys:
  - `moodreel-watchlist`: Saved movies/TV
  - `moodreel-watch-history`: Browsing history for DNA feature
  - `moodreel-mood-history`: Recent mood searches
  - `moodreel-search-persistent-cache`: Cached API results (1hr TTL)
  - `moodreel-achievements`: Unlocked badges
  - `moodreel-user-ratings`: User star ratings
  - `moodreel-user-reviews`: User text reviews
  - `moodreel-playlists`: Custom "Vibe" saves
  - `moodreel_profile`: User profile data
  - `moodreel-region`: Selected watch provider region
  - `moodreel-my-services`: Selected streaming services
  - `moodreel-taste-profile`: Liked/disliked IDs
  - `moodreel-taste-show-hidden`: Show hidden toggle

## UI Principles
- Cinema Noir Premium aesthetics (Dark mode, glassmorphism).
- Gold and Crimson accents (`#FFD700`, `#DC143C`).
- 3D Parallax cards with tilt effects.
- Unified skeleton loading system.
- Keyboard accessibility: Focus rings, ARIA labels, semantic HTML.

## Known Pitfalls
- API rate limits (TMDB): Tracked via `rateLimiter.js`.
- Missing assets: Fallbacks implemented for posters, backdrops, and trailers.
- Request storms: `AbortController` and `inflightRequests` Map used for deduplication.
