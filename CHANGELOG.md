# CHANGELOG

## 2026-05-15

### Implemented

- **Scope:** iOS native Tonight phase + web E2E hardening
- **What changed:**
  - Added a dedicated native `TonightView` and `TonightViewModel` for the iOS app, promoted it to the first tab, and preserved Discover as a separate browsing tab.
  - Gave native Tonight Mode vibe, mood lane, available-time, content type, Solo/Date/Family/Friends context, safe/balanced/adventurous preference, minimum rating, and watched/disliked hiding controls.
  - Returned native Safe Bet, Best Match, and Wild Card cards with confidence, reasons, save actions, details navigation, and sharing.
  - Added deterministic Playwright TMDB fixtures for `/tonight` so E2E can verify the three explained picks without a live TMDB key.
  - Kept API-key handling in Keychain on iOS and local/env key handling on web; no TMDB key was hardcoded.
- **Verification performed:** `npm run format:check`, `npm run test:unit`, `npm run build`, `npm run verify`, focused mocked `/tonight` Playwright E2E, XcodeBuildMCP simulator build, and generic iOS simulator `xcodebuild` all passed.

## 2026-05-14

### Implemented

- **Scope:** web + iOS product upgrade
- **What changed:**
  - Added a dedicated `/tonight` decision-engine route for vibe, runtime, content type, watching context, services-only, safe/adventurous preference, minimum rating, and watched/disliked hiding.
  - Upgraded shared recommendation scoring with mood text, provider availability, runtime fit, context, risk preference, services-only filtering, and explicit `explainRecommendation` support.
  - Kept Home as a lighter discovery entry point with clearer Tonight copy and a primary `Find Tonight's Picks` action.
  - Made MovieCard metadata and save controls visible without hover dependency.
  - Added route smoke unit coverage and stronger recommendation scoring tests.
  - Updated iOS Discover/Tonight parity with Safe Bet / Best Match / Wild Card confidence and reason text while preserving Keychain API key handling and TMDB cache behavior.
  - Added root README and iOS roadmap documentation for the next native Tonight screen.
- **Verification performed:** Pending final verification in this branch.

## 2026-05-11

### Implemented

- **Scope:** web + iOS product upgrade
- **What changed:**
  - Re-centered Discover around Tonight Mode: mood presets, constraint chips, Safe Bet / Best Match / Wild Card, and Pick Between These.
  - Added pure `recommendationScoring` logic with deterministic ranking and explanation tests.
  - Included provider availability, ratings, popularity, taste profile, saved/watched state, selected constraints, and mood/genre affinity in ranking.
  - Made watchlist/watched lookups media-type-aware while preserving legacy ID-only callers.
  - Bounded provider caches and documented the analyzer/performance workflow.
  - Added iOS Discover parity for Tonight constraints and a top-three Tonight picks section without changing Keychain API key handling, privacy manifest, URLCache, or region/provider detail behavior.
- **Verification performed:** Pending in this branch.

## 2026-02-10

### Planned

- **Scope:** frontend
- **What will change:** Audit search categorization + ranking for accuracy/performance, then tighten result ranking logic and mood parsing to reduce false matches and unnecessary compute.
- **Why:** User requested a polish pass and performance-focused improvements to search quality.
- **Verification performed (baseline):** Ran `npm run test -- --watchAll=false` and `npm run build` in `moodreel/`; both passed before code edits.

### Implemented

- **Scope:** frontend
- **What changed:**
  - Improved mood categorization parsing with normalized text handling, token/phrase matching, and removal of reverse-substring matching that could produce false-positive categories.
  - Upgraded search ranking to use normalized token-aware scoring (exact, prefix, full token overlap, partial overlap) for more relevant ordering on free-text searches.
  - Added de-duplication of merged multi-source results (`movie` + `tv`, multi-page merges) before ranking to reduce redundant cards and extra ranking work.
  - Added dedicated ranking unit tests and new parser regression tests for punctuation normalization + false-positive prevention.
- **Why it changed:** Improve perceived search quality, categorization accuracy, and client-side ranking efficiency without altering locked API configuration.
- **Verification performed:** Ran `npm run test -- --watchAll=false` (pass), `npm run build` (pass), and `npm run smoke` (fails in this environment because no local dev server is running and TMDB API key is not configured).

### Planned

- **Scope:** frontend
- **What will change:** Refresh the `Global Mood Pulse` card for cleaner typography, proper spacing, and more trustworthy status text; tighten the emoji quick-pick panel with clearer hierarchy and more compact controls.
- **Why:** Current UI appears unfinished (missing style hooks and crowded text), which hurts clarity and perceived quality.
- **Verification performed (baseline):** Ran `npm run build` in `moodreel/` to confirm a clean baseline before edits.

### Implemented

- **Scope:** frontend
- **What changed:**
  - Reworked `MoodPulse` markup/content to show a professional snapshot layout with explicit percentages, trend cues, and a non-misleading "Updated daily" status.
  - Reworked `EmojiPicker` header/selection feedback and streamlined interaction copy to make multi-select behavior clearer.
  - Added full styling for both sections (cards, bars, labels, responsive grid, focus/active states, particle animation container), fixing missing layout/styling gaps.
- **Why it changed:** Improve visual polish, readability, and trustworthiness while preserving existing mood-selection behavior.
- **Verification performed:** Ran `npm run build` and `npm test -- --watchAll=false`; both passed.

## 2026-02-17

### Planned

- **Scope:** iOS frontend
- **What will change:** Polish discovery UX with richer controls (content-type and quality filters) and clearer browsing states so users can quickly tune recommendations.
- **Why:** User requested App Store–ready polish and stronger features for the iOS app.
- **Verification performed (baseline):** Ran `swift --version` (pass) and attempted `xcodebuild -list -project MoodReel-iOS/MoodReel.xcodeproj` (cannot run in this Linux environment because `xcodebuild` is unavailable).

### Implemented

- **Scope:** iOS frontend
- **What changed:**
  - Added discover feed refinement controls for content type (all/movies/TV), minimum TMDB rating threshold, and sort mode (trending/top rated/newest).
  - Updated discover results rendering and empty-state messaging to account for active filters, so users can distinguish between no API results vs. over-constrained filters.
  - Updated “Surprise Me” behavior and hero count to reflect refined (filtered/sorted) picks.
- **Why it changed:** Gives users faster control over recommendation quality and browsing intent, improving perceived app polish and feature depth for App Store readiness.
- **Verification performed:** Ran `git diff --check` (pass). Attempted `xcodebuild -list -project MoodReel-iOS/MoodReel.xcodeproj` (cannot run in this Linux environment because `xcodebuild` is unavailable).
