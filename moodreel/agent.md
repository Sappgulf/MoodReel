# agent.md — MoodReel Engineering Rules (STRICT)

## Mission
Maintain and improve MoodReel: mood-based discovery + search for movies/TV with a clean, fast UI and reliable data handling.

## Non-Negotiables
- No invented facts: inspect the repo before claiming anything.
- No secret leakage: API keys only via env vars; never log secrets; never commit `.env`.
- No breaking core flows:
  1) Mood flow → results grid
  2) Search → results
  3) Detail view → trailer (if available)
  4) Watchlist persistence

## Output Discipline (Token Efficient)
- Prefer diffs. Only output full files when:
  - creating new files, OR
  - edits are extensive and diff would be noisy.
- Do not paste unchanged code.
- Keep explanations to: intent + verification steps.

## Definition of Done
A change is “done” only if ALL are true:
- App runs in dev.
- App builds successfully.
- No runtime errors during smoke test.
- No console errors/warnings caused by the change.
- Loading/empty/error states render safely.
- Accessibility baseline: labels for inputs, keyboard focus visible, semantic headings.

## Required Workflow
1) Read current code and config.
2) Identify risks (max 5 bullets).
3) Make smallest correct change.
4) Add/adjust tests if testing exists; otherwise add smoke checks in `VERIFY.md`.
5) Verify: dev run + build + manual smoke checklist.

## Architecture Rules
- UI components: `/src/components`
- Route/page-level views: `/src/pages`
- API client + normalization: `/src/services` (e.g., `searchService.js`)
- Shared hooks: `/src/hooks`
- Shared utils: `/src/utils`
- Keep components small: prefer composition over mega-files.

## Data Safety Rules (External API)
- Treat all API fields as optional.
- Normalize responses in one place (service layer), not scattered across UI.
- Always provide fallbacks for:
  - missing poster/backdrop
  - missing title/name
  - missing overview
  - missing trailers
  - empty results
- Handle network and HTTP errors:
  - show user-friendly message
  - allow retry
  - do not crash

## Performance Rules
- Debounce user typing (search).
- Cancel in-flight search requests on new query (AbortController).
- Cache repeat fetches where sensible (localStorage persistence).
- Avoid re-render storms: memoize heavy lists/derived scores.

## UI/UX Rules
- Consistent spacing + typography scale.
- Accessible contrast and focus states.
- Skeleton loaders for async content.
- Responsive: mobile-first; no horizontal scrolling.

## Commits / PRs
- One logical change per commit.
- Commit message: `type(scope): summary`
  - types: feat | fix | refactor | perf | docs | chore | test
- Update `changelog.md` for user-visible changes.

## Prohibited
- Introducing a backend unless explicitly requested.
- Adding heavy dependencies without strong justification.
- Refactors that change behavior without tests or verification steps.
