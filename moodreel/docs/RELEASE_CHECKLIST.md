# MoodReel Release Checklist

Use this before shipping a web release or PWA update.

## Product

- Discover loads with either a configured TMDB key, a saved local Profile key, or a clear setup prompt.
- Tonight Mode returns three explained picks with provider, runtime, rating, and taste reasons.
- Watchlist supports search, sorting, notes, watched/favorite state, random pick, spin wheel, import, export, and share link.
- Movie details show hero art, trailer action, providers, cast, similar titles, rating/review, taste feedback, and share.
- Stats, Calendar, Achievements, Watchlist, and Profile all have useful empty or low-data states.
- Profile setup checklist shows API, services, taste profile, and watchlist readiness.

## Accessibility And UX

- Keyboard users can reach navigation, filters, modals, cards, and destructive confirmations.
- Focus rings remain visible in light and dark themes.
- Reduced-motion users are not forced through decorative motion.
- Mobile view has no horizontal document overflow and bottom navigation does not cover primary actions.
- PWA install prompt avoids obscuring main content.

## Verification

```bash
npm run format:check
npm run verify
npm audit --audit-level=moderate
npm run test:e2e
```

## Browser Smoke

- Desktop: `/`, `/tonight`, `/watchlist`, `/stats`, `/calendar`, `/profile`, `/achievements`, `/404`.
- Mobile: same routes at a narrow viewport.
- Confirm no framework overlay, blank page, console warnings/errors, or horizontal overflow.
- Profile: save a local TMDB key, test connection, clear it, and confirm Discover returns to the setup prompt when no other key is configured.

## Deployment

- Confirm required environment variables are present in the host.
- Confirm `build/manifest.webmanifest`, service worker, icons, and offline fallback are included in the production build.
- Run one production preview smoke after `npm run build`.
