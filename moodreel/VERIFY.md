# VERIFY.md — MoodReel Verification

## Install

```bash
npm install
```

## Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and set:

- `VITE_TMDB_API_KEY`
- Optional: `VITE_TMDB_BASE_URL`
- Legacy aliases still supported: `REACT_APP_TMDB_API_KEY`, `REACT_APP_TMDB_BASE_URL`

Optional alternative (no `.env` edit): set a runtime key in the browser console and reload:

```javascript
localStorage.setItem('moodreel-tmdb-api-key', 'YOUR_TMDB_KEY');
```

## Run (Dev)

```bash
npm start
```

## Build

```bash
npm run build
```

## Automated Verification

```bash
npm run verify
npm run typecheck
npm run format:check
npx playwright install chromium webkit
npm run test:e2e
```

The `/tonight` E2E decision-flow test uses deterministic TMDB mocks from `e2e/fixtures/tmdb.js`; it does not require a real TMDB key. Other exploratory E2E flows still need `VITE_TMDB_API_KEY` or a browser-saved local key when they hit live TMDB.

## iOS Compile Check

```bash
xcodebuild -project ../MoodReel-iOS/MoodReel.xcodeproj \
  -scheme MoodReel \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  build CODE_SIGNING_ALLOWED=NO
```

## Manual Smoke Checklist

- Fresh install / no API key: clear local storage, launch app, confirm branded API key-needed state links to Profile.
- Valid API key: save a local key in Profile or set `VITE_TMDB_API_KEY`, then reload Discover.
- Route smoke: open `/`, `/tonight`, `/watchlist`, `/stats`, `/calendar`, `/profile`, `/achievements`, and `/404`.
- Mood flow: enter mood -> recommendations grid appears.
- Tonight Mode route: open `/tonight`, enter a vibe, choose time/context/services, click `Find Tonight's Picks`, and confirm Safe Bet / Best Match / Wild Card render with explanations.
- Mocked Tonight E2E: run `npm run test:e2e -- --project=chromium --grep "tonight mode returns three explained mocked picks"` and confirm the three slots render from fixtures.
- Home Tonight Mode: choose a “What kind of night is it?” preset and confirm Safe Bet / Best Match / Wild Card render with explanations after a mood search.
- Constraint chips: toggle under 90, streaming now, family friendly, no horror, hidden gem, high rating, newer, classic, low commitment, and wild card; confirm ranking/filter copy updates without crashing.
- Pick Between These: compare the three Tonight picks, confirm best-for-tonight/safe/wild reasons, pick one shortlist title, confirm it locks and saves, and swap another out on Home.
- Search: title search works in both “within mood results” and “search all” modes.
- Details: open a title and confirm metadata, cast, and similar titles render.
- Trailer fallback: if no trailer, fallback message is shown (no crash).
- Watchlist persistence: add/remove, refresh page, and verify saved items persist.
- Provider display: provider badges show on cards; details page groups stream/rent/buy when available.
- Provider filters: “My Services” selection filters results when provider data is available; `/tonight` services-only excludes known unavailable titles.
- Region selection: change region in Profile and confirm providers update.
- Taste profile: like/dislike impacts ranking; hidden titles show when toggled.
- Shareable link: “Copy link” includes mood, filters, search query, region, and services.
- Mobile viewport: verify touch targets, bottom navigation, Tonight chips, and Pick Between These stack cleanly.
- Reduced motion: enable reduced motion and confirm large transitions/shortlist hover motion are suppressed.
- Offline/cached behavior: disconnect network after prior use and confirm cached/offline banner behavior is understandable.
