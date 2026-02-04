# MoodReel – Ship Guide

> Cinema-noir movie & TV discovery app built with React 18

## Quick Start

```bash
cd moodreel
npm install
cp .env.example .env  # Add your TMDB API key
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_TMDB_API_KEY` | ✅ | [Get one here](https://www.themoviedb.org/settings/api) |

### Local Runtime Key (Optional)
If you want to avoid editing `.env`, set a local-only key in the browser console:

```javascript
localStorage.setItem('moodreel-tmdb-api-key', 'YOUR_TMDB_KEY')
```

Reload the page after setting it.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server at http://localhost:3000 |
| `npm run build` | Production build to `/build` |
| `npm test` | Run test suite |
| `npm run eject` | Eject from CRA (irreversible) |

## Architecture

```
src/
├── index.js         # React 18 createRoot entry
├── App.js           # Router + ErrorBoundary + Suspense
├── pages/
│   ├── Home.js      # Mood input, genre filters, results
│   ├── MovieDetails.js  # Details, providers, similar
│   └── Watchlist.js # Saved items
├── components/
│   ├── MovieCard.js # Memoized card component
│   ├── Skeleton.js  # Loading placeholders
│   └── ErrorBoundary.js # Crash protection
├── hooks/
│   └── useWatchlist.js  # localStorage persistence
└── [App|index].css  # Design system + components
```

## Key Features

- **Mood-to-genre mapping**: Natural language → TMDB genres
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
