# changelog.md

All notable changes to this project are documented here.

Format: Keep a Changelog (minimal). Dates are YYYY-MM-DD.
Types: Added, Changed, Fixed, Performance, Security.

## [Unreleased]
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
