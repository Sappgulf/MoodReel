# agent.md — MoodReel Engineering Rules (STRICT)

## Mission

Maintain and improve MoodReel: a cinematic decision engine for mood-based movie/TV discovery with a clean, fast UI and reliable data handling.

## Non-Negotiables

- No invented facts: inspect the repo before claiming anything.
- No secret leakage: never hardcode TMDB keys; never commit `.env`; never log API keys in production paths.
- No breaking core flows:
  1. Tonight Mode / mood flow → three ranked picks
  2. Search → results
  3. Detail view → trailer (if available)
  4. Watchlist persistence
- Do not introduce a backend unless explicitly requested.

## API Key Rules

TMDB keys are resolved in `src/services/apiClient.js` from (in order):

1. `VITE_TMDB_API_KEY` (or legacy `REACT_APP_TMDB_API_KEY`)
2. `window.__MOODREEL_TMDB_API_KEY__` bootstrap hook
3. User key saved in localStorage via Profile

`apiClient.js` may be modified when fixing bugs or improving key resolution, caching, or retries — but never to embed a hardcoded key. iOS uses Keychain via `APIKeyStore`; do not bypass it.

Production deployers must use TMDB domain-restricted keys; Vite `VITE_*` variables are public in the client bundle.

## Output Discipline (Token Efficient)

- Prefer diffs. Only output full files when creating new files or edits would be noisy as a diff.
- Do not paste unchanged code.
- Keep explanations to: intent + verification steps.

## Definition of Done

A change is “done” only if ALL are true:

- App runs in dev (`npm run dev` from `moodreel/`).
- `npm run verify` passes (lint, unit tests, build, bundle size gate).
- No runtime errors during smoke test.
- No console errors/warnings caused by the change.
- Loading/empty/error states render safely.
- Accessibility baseline: labels for inputs, keyboard focus visible, semantic headings.

## Required Workflow

1. Read current code and config.
2. Identify risks (max 5 bullets).
3. Make smallest correct change.
4. Add/adjust tests when behavior changes; otherwise note manual checks in `VERIFY.md`.
5. Verify: `npm run verify` (+ `npm run test:e2e` for routing/PWA changes).

## Architecture Rules

- UI components: `/src/components`
- Route/page-level views: `/src/pages`
- API client + normalization: `/src/services` (e.g., `searchService.js`, `apiClient.js`)
- Shared hooks: `/src/hooks`
- Shared utils: `/src/utils` (keep scoring/parsing pure and testable)
- Keep components small: prefer composition over mega-files (`Home.jsx` and `MovieDetails.jsx` are known debt).

## Data Safety Rules (External API)

- Treat all API fields as optional.
- Normalize responses in the service layer, not scattered across UI.
- Always provide fallbacks for missing poster/backdrop, title/name, overview, trailers, and empty results.
- Handle network and HTTP errors with user-friendly messages and retry; do not crash.

## Performance Rules

- Debounce user typing (search).
- Cancel in-flight requests on new query (`AbortController`).
- Cache repeat fetches where sensible (`safeStorage.js`, in-memory caches).
- Avoid re-render storms: memoize heavy lists and derived scores.
- Respect bundle size limits (`npm run bundle:check`).

## UI/UX Rules

- Consistent spacing + typography scale.
- Accessible contrast and focus states.
- Skeleton loaders for async content.
- Responsive: mobile-first; no horizontal scrolling.

## PWA Rules

- Service worker lives at `public/service-worker.js`.
- Register from `src/App.jsx` only (production, with update toast UX).
- Do not add a second registration in `index.html`.

## Commits / PRs

- One logical change per commit.
- Commit message: `type(scope): summary`
  - types: feat | fix | refactor | perf | docs | chore | test
- Update `changelog.md` for user-visible changes.

## Prohibited

- Hardcoding TMDB API keys in source.
- Adding heavy dependencies without strong justification.
- Refactors that change behavior without tests or verification steps.
- Duplicate service worker registration.
