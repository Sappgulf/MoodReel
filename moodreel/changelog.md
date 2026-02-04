# changelog.md

All notable changes to this project are documented here.

Format: Keep a Changelog (minimal). Dates are YYYY-MM-DD.
Types: Added, Changed, Fixed, Performance, Security.

## [Unreleased]
- Planned (2026-02-04, frontend): Restore client-side TMDB API access path while keeping credentials out of the repo; baseline verification to run `npm test -- --watchAll=false`.
- Implemented (2026-02-04, frontend): Restored client-side TMDB API access with runtime key fallback and updated docs for local setup. Verification: `npm test -- --watchAll=false`.
- Planned (2026-02-04, frontend): Reinstate API key usage guidance and record memory note; baseline verification with `npm test -- --watchAll=false`.
- Planned (2026-02-04, frontend): Implement Sprints 1–3 foundation/usefulness/delight upgrades, with baseline verification. Verification: `npm run test:ci`.
- Planned (2026-02-04, frontend): Audit performance, UI polish, and bug fixes with baseline tests run (`npm test -- --watchAll=false`).
- Implemented (2026-02-04, frontend): Added memory reminder to keep TMDB API key sourced via environment variables. Verification: `npm test -- --watchAll=false`.
- Implemented (2026-02-04, frontend): Added API client + normalization, debounced search with scope toggle, provider catalog/badges, taste profile, shareable links, and docs updates. Verification: `npm run test:ci`, `npm run build` (Browserslist warning).
- Added (2026-02-04, frontend): Provider badges, taste profile controls, shareable links, and settings for region selection.
- Changed (2026-02-04, frontend): Centralized TMDB API access with normalization, debounced search, and safe fallbacks.
- Fixed (2026-02-04, frontend): Error handling consistency and trailer/overview/poster fallbacks.
- Performance (2026-02-04, frontend): Cached provider and search data; reduced request storms with abort + debounce.
- Security (2026-02-04, frontend): Removed hardcoded API key; require env configuration.
- Implemented (2026-02-04, frontend): Improved discovery search resiliency by keeping cached results visible during errors and preventing overlapping pagination fetches; added abort handling for load-more requests. Verification: `npm test -- --watchAll=false`, `npm run build` (Browserslist warning only).
- Added: Glassmorphic "Vibe Bar" hero section with interactive suggestions.
- Added: Triple-A CSS animations with spring easing and GPU acceleration.
- Added: Fallback placeholder handling for broken movie posters and missing backdrops.
- Changed: Refined Cinema Noir Design System with improved contrast and gold glow effects.
- Changed: Optimized mobile bottom navigation visibility logic.
- Fixed: Resolved navigation string bug in desktop views.
- Fixed: Corrected input focus color bug in Mood Selector.
- Performance: Implemented `will-change` on parallax cards for 60fps scrolling.
- Performance: Added `decoding="async"` to heavy image assets.

## [0.1.0] - 2026-02-04
- Added: Initial MoodReel app with mood-based discovery, search, details, trailers, and watchlist.
- Added: Achievement system and cinematic DNA analytics.
- Added: PWA support with install prompt and offline caching.
