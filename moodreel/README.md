# MoodReel (Web/PWA)

Mood-based movie/TV discovery app built with React + Vite.

## Quick start

```bash
npm install
cp .env.example .env
# set VITE_TMDB_API_KEY
npm run dev
```

## Scripts

- `npm run dev` / `npm start` — Vite dev server
- `npm run build` — production build (`build/`)
- `npm run preview` — preview build
- `npm run test:unit` — Jest unit tests (legacy CRA runner)
- `npm run test:e2e` — Playwright E2E
- `npm run verify` — format check + unit + build

## Notes on test tooling

The app runtime is Vite. Unit tests currently run on the existing `react-scripts` Jest path for compatibility; this is a legacy test runner path, not the production build path.
