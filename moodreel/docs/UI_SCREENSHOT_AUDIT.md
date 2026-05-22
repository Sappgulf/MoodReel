# MoodReel UI Screenshot Audit

Playwright captures every major route at **desktop (1280px)** and **mobile (390px)** with TMDB mocks.

## Run

```bash
cd moodreel
SCREENSHOT_DIR=./screenshots-audit CI=true npx playwright test e2e/screenshot-audit.spec.js --project=chromium
```

## Screenshots

| #   | Desktop / Mobile   | Route                     |
| --- | ------------------ | ------------------------- |
| 01  | discover           | `/` (mood selected)       |
| 02  | tonight            | `/tonight` (cozy + picks) |
| 03  | watchlist          | `/watchlist`              |
| 04  | achievements       | `/achievements`           |
| 05  | profile            | `/profile` (Explore hub)  |
| 06  | stats              | `/stats`                  |
| 07  | calendar           | `/calendar`               |
| 08  | movie-detail       | `/movie/550`              |
| 09  | not-found          | invalid URL               |
| 10  | keyboard-shortcuts | `/` + `?`                 |

Paths: `screenshots-audit/desktop/`, `screenshots-audit/mobile/`

## Professional polish applied

- **404:** “Lost in the backlot” with Discover, Tonight, and quick links
- **Empty states:** Shared `EmptyState` on Stats, Calendar, Achievements, Tonight
- **Stats:** Empty dashboard hidden until user has data
- **Achievements:** One progress bar; getting-started uses `EmptyState`
- **Nav:** Tonight in desktop + mobile; Calendar secondary; Profile Explore hub
- **CSS:** `professional-polish.css` — page shell, calendar mobile, watchlist toolbar scroll
