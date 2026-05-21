# MoodReel Verification

## Install

```bash
npm install
```

## Build + tests

```bash
npm run format:check
npm run test:unit
npm run build
```

## Optional E2E

```bash
npm run test:e2e
```

Run in CI with mocked TMDB (`e2e/tmdbMock.js` + `VITE_TMDB_API_KEY` in `playwright.config.js`). Detail-page content assertions are covered by manual smoke until Strict Mode dev timing is isolated.

## Manual smoke checks (web)

- Mood search returns results.
- Title search returns results.
- Details page loads metadata, trailer fallback, providers, similar content.
- Provider filter honesty: “My Services” should not imply confirmed availability while provider data is still unknown.
- Watchlist persistence survives refresh.
- Shareable link restores mood/filter/query/region/provider state.
- Missing/invalid API key shows safe user-facing error (no key leakage).
- PWA install prompt appears in production context.
- Offline sanity: app shell reloads and no crash when offline.

## iOS verification steps

1. Open `MoodReel-iOS/MoodReel.xcodeproj`.
2. Enter TMDB API key via app gate.
3. Build and run simulator target.
4. Smoke test Discover, Watchlist, Detail, Settings, and API-key reset flow.
