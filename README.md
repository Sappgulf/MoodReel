# MoodReel Monorepo

This repository contains two client apps:
- `moodreel/` — Web + PWA app (React 18 + Vite)
- `MoodReel-iOS/` — Native iOS app (SwiftUI)

## Web app (moodreel)

```bash
cd moodreel
npm install
cp .env.example .env
# set VITE_TMDB_API_KEY
npm run dev
```

### Web verification

```bash
cd moodreel
npm run format:check
npm run test:unit
npm run build
```

`npm run test:e2e` is available (Playwright) but should be run only when API-key test conditions are configured.

## iOS app (MoodReel-iOS)

1. Open `MoodReel-iOS/MoodReel.xcodeproj` in Xcode.
2. Select the `MoodReel` scheme.
3. Run on iOS Simulator.
4. Validate API-key gate, Discover, Watchlist, Detail, and Settings key reset.

## Environment and API key

- Web expects `VITE_TMDB_API_KEY`.
- Legacy `REACT_APP_*` env keys are only for old CRA test/runtime compatibility and are not the primary path.
- Do not commit `.env`.
