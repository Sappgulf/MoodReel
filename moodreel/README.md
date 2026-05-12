# MoodReel

MoodReel is a Vite + React mood-to-decision engine for finding what to watch tonight. The core loop is mood → constraints → three confident picks → human-readable explanation → trailer/provider detail → save/watch/rate → better future recommendations.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

The Vite dev server runs at http://localhost:3000.

## Environment

| Variable                  | Required | Description                                     |
| ------------------------- | -------- | ----------------------------------------------- |
| `VITE_TMDB_API_KEY`       | Yes      | TMDB API key for local and deployed web builds. |
| `REACT_APP_TMDB_API_KEY`  | Legacy   | CRA-compatible alias kept for old environments. |
| `VITE_TMDB_BASE_URL`      | No       | Override TMDB API base URL.                     |
| `REACT_APP_TMDB_BASE_URL` | Legacy   | CRA-compatible base URL alias.                  |
| `VITE_VAPID_PUBLIC_KEY`   | No       | Optional web push public VAPID key.             |

For local-only testing without editing `.env`, open **Profile → Privacy & Local Data** and use the
TMDB API key field:

1. Add your TMDB key in the input.
2. Click **Save local key**.
3. Return to Discover; the app no longer requires env configuration at runtime for that browser.

## Scripts

| Command                                  | Description                                         |
| ---------------------------------------- | --------------------------------------------------- |
| `npm run dev` / `npm start`              | Start Vite on http://localhost:3000.                |
| `npm run build`                          | Build production assets into `build/`.              |
| `npm run preview`                        | Serve the production build locally.                 |
| `npm run lint`                           | Run ESLint over `src/`.                             |
| `npm run typecheck`                      | Run TypeScript contract checks with `tsc --noEmit`. |
| `npm run test:run` / `npm run test:unit` | Run Vitest unit tests once.                         |
| `npm run test:ci`                        | Run Vitest with coverage.                           |
| `npm run test:e2e`                       | Run Playwright E2E tests.                           |
| `npm run bundle:check`                   | Check production bundle size.                       |
| `npm run analyze`                        | Build with Rollup visualizer output in `build/`.    |
| `npm run verify`                         | Run lint, unit tests, build, and bundle check.      |

Playwright browsers are required before E2E on a fresh machine:

```bash
npx playwright install chromium webkit
```

## App Structure

```text
src/
├── main.jsx
├── App.jsx
├── components/
│   ├── home/
│   ├── MovieCard.jsx
│   ├── TrailerModal.jsx
│   └── ...
├── context/
├── hooks/
│   ├── useMovieDiscovery.js
│   ├── useDiscoveryUrlState.js
│   ├── useProviderSettings.js
│   └── useWatchlist.js
├── pages/
│   ├── Home.jsx
│   ├── MovieDetails.jsx
│   ├── Watchlist.jsx
│   └── ...
├── services/
│   ├── apiClient.js
│   ├── providerService.js
│   └── searchService.js
├── storage/
├── styles/
└── utils/
```

## Product Direction

MoodReel is centered on **Tonight Mode**, not generic catalog browsing:

- Start with “What kind of night is it?” mood presets.
- Add constraints such as under 90 minutes, streaming now, family friendly, no horror, hidden gem, high rating, newer, classic, low commitment, or wild card.
- Return a focused shortlist: **Safe Bet**, **Best Match**, and **Wild Card**.
- Explain every pick with visible ranking reasons such as mood fit, provider availability, rating confidence, taste profile, saved/watched state, and constraint match.
- Keep deeper browsing available, but bias the main flow toward fewer better choices.

## Verification

```bash
npm run verify
npm run typecheck
npm run format:check
npm run test:e2e
```

## Performance Notes

- Secondary routes and heavier overlays are lazy-loaded from `App.jsx`.
- `src/utils/recommendationScoring.js` is pure and unit-tested so ranking changes do not require UI rewrites.
- Provider and TMDB response caches are bounded to prevent unbounded session growth.
- Posters/backdrops use lazy loading by default; hero imagery is eager only where it is the primary visual.
- Use `npm run analyze` when a feature adds a sizeable dependency or route.

## Deployment

Vercel is configured for either repo-root or `moodreel/` project roots:

- Repo-root `vercel.json` runs `cd moodreel && npm ci`, builds `moodreel/`, and serves `moodreel/build`.
- `moodreel/vercel.json` supports setting the Vercel project root directly to `moodreel/`.
- Both configs use explicit Vite build commands.

## iOS App

The native iOS app lives in `../MoodReel-iOS`.

```bash
xcodebuild -project ../MoodReel-iOS/MoodReel.xcodeproj \
  -scheme MoodReel \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  build CODE_SIGNING_ALLOWED=NO
```
