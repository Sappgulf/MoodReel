# changelog.md

All notable changes to this project are documented here.

Format: Keep a Changelog (minimal). Dates are YYYY-MM-DD.
Types: Added, Changed, Fixed, Performance, Security.

## [Unreleased]

- Fixed: Removed duplicate service worker registration from `index.html`; PWA registration now runs only from `App.jsx` with update UX.
- Changed: CI now runs the bundle size gate (`bundle:check`) after production builds.
- Changed: Refreshed `agent.md` and `memory.md` to match the Vite/Vitest stack and current TMDB key resolution (no hardcoded keys).
- Added: Persisted Tonight Mode preferences (vibe, runtime, context, risk, services, rating, hide toggles) via `useTonightPreferences`.
- Added: iOS Tonight provider preferences with region, service chips, and services-only filtering.
- Added: GitHub Actions iOS build job and Playwright coverage for Pick Between These / compare panels.
- Changed: Extracted Home Tonight setup UI into `HomeTonightSetup` and shared discovery constants.
- Changed: ESLint `react-hooks/rules-of-hooks` is now an error.
- Performance: Hardened persistent search caching by pruning stale entries, enforcing recency-based cache caps, and writing cache cleanups back to localStorage.
- Fixed: Guarded search cache cleanup for non-browser environments to avoid localStorage reference errors.
- Changed: Redesigned the Global Mood Pulse block with proper spacing, clear percentages, and a transparent "Updated daily" snapshot label.
- Changed: Tightened the emoji quick-pick UI with clearer header guidance, active-count feedback, and improved grid/button styling.
- Added: "Clear All Filters" button in Home search.
- Changed: Hardcoded TMDB API key for simplified single-user deployment.
- Changed: Improved visibility of MovieCard actions on mobile/touch devices.
- Changed: Replaced blocking `alert()` popups with an in-app toast stack (save vibe, copy links).
- Fixed: Corrected routing in "Surprise Me" banner to use React Router Link.
- Fixed: Resolved missing Link import in Home.js.
- Fixed: Light mode now updates the full design token palette (including header/nav chrome).
- Fixed: Clipboard copy uses a safe fallback when the Clipboard API is unavailable.
- Fixed: Added missing `aria-label` attributes for key controls (shortcuts button, profile inputs).
- Security: "Locked" API configuration in `agent.md` and `.antigravityignore`.

## [0.1.0] - 2026-02-04

- Added: Initial MoodReel app with mood-based discovery, search, details, trailers, and watchlist.
- Added: Achievement system and cinematic DNA analytics.
- Added: PWA support with install prompt and offline caching.
