# MoodReel UI Screenshot Audit

Captured with Playwright (`e2e/screenshot-audit.spec.js`) using TMDB mocks and onboarded storage.

## Run again

```bash
cd moodreel
SCREENSHOT_DIR=./screenshots-audit CI=true npx playwright test e2e/screenshot-audit.spec.js --project=chromium
```

Outputs:

- `screenshots-audit/desktop/*.png` — 1280×800 viewport, full page
- `screenshots-audit/mobile/*.png` — 390×844 viewport, full page

## Pages captured

| File                    | Route             | Notes                                  |
| ----------------------- | ----------------- | -------------------------------------- |
| `01-discover`           | `/`               | Mood selected, recommendations visible |
| `02-tonight`            | `/tonight`        | Cozy preset + "Get tonight picks"      |
| `03-watchlist`          | `/watchlist`      | Library                                |
| `04-achievements`       | `/achievements`   | Badges grid                            |
| `05-profile`            | `/profile`        | Hub links to Stats, Calendar, Tonight  |
| `06-stats`              | `/stats`          | Taste analytics                        |
| `07-calendar`           | `/calendar`       | Mood history                           |
| `08-movie-detail`       | `/movie/550`      | Fight Club detail                      |
| `09-not-found`          | `/does-not-exist` | 404                                    |
| `10-keyboard-shortcuts` | `/` + `?`         | Shortcuts modal                        |

## Nav changes (this pass)

- **Desktop:** Discover → **Tonight** (featured) → Watchlist → Awards → Stats → Profile; Calendar in secondary row.
- **Mobile (5 tabs):** Discover, Tonight, Watchlist, Awards, Profile — Stats & Calendar via Profile hub.
- **Tonight:** Mood preset chips, dedicated `tonight.css`, default mood `cozy`.

## Refinement checklist

- [ ] Tonight picks grid spacing on very wide screens
- [ ] Achievements page length / collapse sections
- [ ] Stats charts contrast in light mode
- [ ] Calendar empty state copy
- [ ] Movie detail provider row on mobile
