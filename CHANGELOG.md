# CHANGELOG

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
