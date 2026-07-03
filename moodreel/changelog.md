# changelog.md

All notable changes to this project are documented here.

Format: Keep a Changelog (minimal). Dates are YYYY-MM-DD.
Types: Added, Changed, Fixed, Performance, Security.

## [Unreleased]

- Changed: Collapsed the Home Tonight setup from four separate cards into a single unified "Tonight cockpit" panel (mode + constraints + quick moods + streaming + taste recap in one flowing surface).
- Changed: Promoted the 3 tonight picks into a dedicated `TonightDecisionPanel` that sits right after the cockpit, with an inviting ghost-state empty layout and a "Run Tonight Mode" CTA when no search has been run.
- Changed: Hidden the `HomeDiscoveryConsole` (refine + filter + export) in idle state so the home page has fewer competing "find something" affordances; surfaced `MoodPlaylists` as its own section in idle state instead.
- Added: Ghost pick cards with shimmer + pulse animation to visualize the Safe Bet / Best Match / Wild Card slots before the user runs Tonight Mode.
- Changed: Tidied `HomeResultsPanel` so the "Pick Between These" decision lives in its own component instead of being embedded inside the recommendations list.
- Changed: Compacted mobile ghost pick cards and the empty-state CTA so the idle home page is shorter on phones.
- Fixed: Removed duplicate service worker registration from `index.html`; PWA registration now runs only from `App.jsx` with update UX.
- Changed: CI now runs the bundle size gate (`bundle:check`) after production builds.
- Changed: Refreshed `agent.md` and `memory.md` to match the Vite/Vitest stack and current TMDB key resolution (no hardcoded keys).
- Added: Persisted Tonight Mode preferences (vibe, runtime, context, risk, services, rating, hide toggles) via `useTonightPreferences`.
- Added: iOS Tonight provider preferences with region, service chips, and services-only filtering.
- Added: GitHub Actions iOS build job and Playwright coverage for Pick Between These / compare panels.
- Changed: Extracted Home Tonight setup UI into `HomeTonightSetup` and shared discovery constants.
- Changed: Split `MovieDetails.jsx` into `useMovieDetails`, presentation components, and pure utils.
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
