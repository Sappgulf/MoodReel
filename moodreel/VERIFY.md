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
- `REACT_APP_TMDB_API_KEY`
- Optional: `REACT_APP_TMDB_BASE_URL`

## Run (Dev)
```bash
npm start
```

## Build
```bash
npm run build
```

## Manual Smoke Checklist
- Mood flow: enter mood → recommendations grid appears.
- Search: title search works in both “within mood results” and “search all” modes.
- Details: open a title and confirm metadata, cast, and similar titles render.
- Trailer fallback: if no trailer, fallback message is shown (no crash).
- Watchlist persistence: add/remove, refresh page, and verify saved items persist.
- Provider display: provider badges show on cards; details page groups stream/rent/buy when available.
- Provider filters: “My Services” selection filters results when provider data is available.
- Region selection: change region in Profile and confirm providers update.
- Taste profile: like/dislike impacts ranking; hidden titles show when toggled.
- Shareable link: “Copy link” includes mood, filters, search query, region, and services.
