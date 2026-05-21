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

- `npm run dev` / `npm start` — Vite dev server (port 3000)
- `npm run build` — production build (`build/`)
- `npm run preview` — preview build
- `npm run test:unit` — Vitest unit tests
- `npm run test:e2e` — Playwright E2E (starts dev server)
- `npm run verify` — format check + unit tests + build

## Environment

| Variable                | Purpose                               |
| ----------------------- | ------------------------------------- |
| `VITE_TMDB_API_KEY`     | TMDB API key (required for live data) |
| `VITE_TMDB_BASE_URL`    | Optional TMDB base URL override       |
| `VITE_VAPID_PUBLIC_KEY` | Optional web push subscription key    |

Legacy `REACT_APP_*` aliases are still read where noted for migration compatibility.
