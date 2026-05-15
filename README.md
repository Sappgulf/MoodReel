# MoodReel

MoodReel is a cinematic decision engine for picking what to watch tonight.

The main web app lives in `moodreel/` and the native iOS app lives in `MoodReel-iOS/`.

## Product Direction

The core loop is:

1. Tell MoodReel your vibe, available time, services, and watching context.
2. MoodReel ranks the catalog with provider, runtime, rating, popularity, taste, and watch-history signals.
3. The app returns exactly three decision slots: Safe Bet, Best Match, and Wild Card.
4. Each pick explains why it won, links to details, supports saving, and can be shared.

## Web

```bash
cd moodreel
npm install
cp .env.example .env
npm run dev
```

Set `VITE_TMDB_API_KEY` in `moodreel/.env`, or save a local browser key from Profile. Do not hardcode TMDB keys.

Verification:

```bash
cd moodreel
npm run format:check
npm run test:unit
npm run build
npm run verify
```

## iOS

```bash
xcodebuild -project MoodReel-iOS/MoodReel.xcodeproj \
  -scheme MoodReel \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  build CODE_SIGNING_ALLOWED=NO
```

The iOS app keeps TMDB API keys in Keychain and should not embed secrets in source.
