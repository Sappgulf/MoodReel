# CHANGELOG

## 2026-05-21

### Implemented
- **Scope:** web tests + iOS docs + E2E
- **What changed:**
  - Audit pass: lockfile sync, Tonight repair, offline UX, provider tests, CI E2E mocks.
  - Follow-up: `modalFocus` unit tests; E2E skip-link, detail, and Tonight smoke; iOS TestFlight + crash docs.
- **Why it changed:** Ship-ready CI and TestFlight preparation.

## 2026-05-01

### Implemented
- **Scope:** web + docs + CI
- **What changed:**
  - Fixed Vercel deployment alignment for root/subdirectory Vite builds and SPA rewrites.
  - Cleaned web scripts to reflect Vite runtime path and explicit verification flow.
  - Sanitized TMDB request logging by redacting `api_key` in error debug payloads.
  - Fixed watchlist identity collisions by keying watchlist/notes/watched/favorites by `media_type:id` with migration compatibility.
  - Moved service worker registration out of inline HTML into `src/main.jsx` with production gating.
  - Refreshed README/VERIFY/SHIP/TODO docs and web CI checks.
- **Why it changed:** Production-readiness pass for safer deployment, clearer docs, and correctness.

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
