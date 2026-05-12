# MoodReel – Ship Guide

> Cinema-noir mood-to-decision app built with React 18

## Quick Start

```bash
cd moodreel
npm install
cp .env.example .env  # Add your TMDB API key
npm start
```

## Environment Variables

| Variable                 | Required  | Description                                                       |
| ------------------------ | --------- | ----------------------------------------------------------------- |
| `VITE_TMDB_API_KEY`      | ✅        | [Get one here](https://www.themoviedb.org/settings/api)           |
| `REACT_APP_TMDB_API_KEY` | ✅ Legacy | [Get one here](https://www.themoviedb.org/settings/api)           |
| `VITE_VAPID_PUBLIC_KEY`  | Optional  | Web Push: public VAPID key (legacy: `REACT_APP_VAPID_PUBLIC_KEY`) |

### Local Runtime Key (Optional)

If you want to avoid editing `.env`, set a local-only key in **Profile → Privacy & Local Data**:

1. Open **Profile → Privacy & Local Data**.
2. Paste your TMDB key into **TMDB API Key**.
3. Click **Save local key**.

Reload the app if needed.

## Scripts

| Command                 | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `npm start`             | Dev server at http://localhost:3000 (Vite)      |
| `npm run build`         | Production build to `/build`                    |
| `npm test` / `test:run` | Unit tests (Vitest, watch / single run)         |
| `npm run test:unit`     | Same as `test:run` (CI-friendly)                |
| `npm run lint`          | ESLint on `src/`                                |
| `npm run typecheck`     | `tsc --noEmit` (shared types in `src/types.ts`) |
| `npm run format:check`  | Prettier check                                  |
| `npm run test:e2e`      | Playwright browser smoke tests                  |

On a fresh machine or clean CI image, install Playwright browsers before E2E:

```bash
npx playwright install chromium webkit
```

## TypeScript vs JavaScript

The app stays **React + JSX** for screens and hooks. **`src/types.ts`** holds shared interfaces and constants; `npm run typecheck` runs `tsc --noEmit` so those contracts stay checked without forcing a whole-app migration. New code can add `.ts` / `.tsx` gradually; keep `strict` migration deliberate.

## Architecture

```
src/
├── main.jsx              # Vite entry
├── App.jsx               # Router + ErrorBoundary + Suspense
├── pages/
│   ├── Home.jsx          # Discovery (mood + title search + results)
│   ├── MovieDetails.jsx
│   └── Watchlist.jsx
├── components/
│   ├── home/             # Home page sections (hero, trending, results)
│   ├── MovieCard.jsx
│   ├── Skeleton.jsx
│   └── ErrorBoundary.jsx
├── hooks/
│   ├── useWatchlist.js
│   └── useSurpriseShuffle.js
└── styles/               # Layered CSS
```

## Key Features

- **Mood-to-genre mapping**: Natural language → TMDB genres
- **Tonight Mode**: Mood + constraints → Safe Bet, Best Match, and Wild Card
- **Explainable scoring**: Provider availability, taste, saved/watched state, rating, popularity, and constraints influence ranking
- **Pick Between These**: Compare the shortlist and lock one title without doomscrolling
- **Movie/TV toggle**: Instant content type switching
- **Watchlist**: localStorage-persisted favorites
- **Streaming providers**: "Where to watch" via TMDB
- **Similar content**: Recommendations on detail pages

## Performance Optimizations

- ✅ React.lazy() route code-splitting
- ✅ React.memo() on MovieCard
- ✅ AbortController for all API calls
- ✅ Image lazy loading
- ✅ Memoized callbacks (useCallback)
- ✅ Bounded TMDB/provider caches
- ✅ `npm run analyze` behind Rollup visualizer for bundle investigation

## Accessibility

- ✅ Semantic HTML (`<main>`, `<article>`, `<section>`)
- ✅ ARIA labels and live regions
- ✅ Keyboard navigation support
- ✅ Focus-visible states
- ✅ prefers-reduced-motion support
- ✅ Good color contrast

## Deployment

### Vercel (Recommended)

```bash
npm run build
npx vercel --prod
```

Vercel is wired for both root and subdirectory deployments:

- Repo root `vercel.json` builds `moodreel/` and outputs `moodreel/build`
- `moodreel/vercel.json` supports setting the Vercel project root directly to `moodreel/`
- Both configs use explicit install/build commands so Vercel stays on the Vite build path

### Netlify

```bash
npm run build
# Deploy /build folder
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]
```

## API Reference

All data from [TMDB API v3](https://developer.themoviedb.org/docs):

- `GET /genre/{movie|tv}/list` – Genre catalog
- `GET /discover/{movie|tv}` – Filter by genre
- `GET /search/{movie|tv}` – Text search
- `GET /{movie|tv}/{id}` – Details
- `GET /{movie|tv}/{id}/similar` – Recommendations
- `GET /{movie|tv}/{id}/watch/providers` – Streaming info

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## iOS Verification

The native app lives in `../MoodReel-iOS`. Use a signing-free simulator build for compile verification:

```bash
xcodebuild -project ../MoodReel-iOS/MoodReel.xcodeproj \
  -scheme MoodReel \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  build CODE_SIGNING_ALLOWED=NO
```
