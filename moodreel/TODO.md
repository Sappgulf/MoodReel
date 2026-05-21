# MoodReel Backlog

## P0 — must fix before sharing

- [x] Replace legacy `react-scripts` unit test runner with Vitest.
- [x] Sync `package-lock.json` with Vitest/jsdom dependencies (CI `npm ci`).
- [x] Repair broken `Tonight.jsx` page.
- [x] Add CI-safe E2E with TMDB route mocks (Playwright `web-e2e` job).

## P1 — quality polish

- [x] Remove remaining broad CSS transitions (`transition: all`) with explicit properties.
- [x] Improve offline fallback UX copy and dedicated offline screen.
- [x] Provider/filter tests with TMDB fixtures.
- [x] Modal focus-trap unit tests (`modalFocus.test.js`).
- [x] E2E skip-link and detail-page assertions; Tonight route smoke test.
- [ ] Broader keyboard focus-order regression suite (route-level Playwright tab walks).

## P2 — product additions

- Share card exporter for mood-based social previews.
- Expanded provider-region presets and onboarding.
- Better multi-profile local persistence.

## P3 — iOS/TestFlight readiness

- [x] TestFlight preflight checklist (`MoodReel-iOS/TESTFLIGHT.md`).
- [x] Crash/reporting instrumentation plan (`MoodReel-iOS/CRASH_REPORTING.md`).
- [ ] Complete privacy nutrition labels and legal content review in App Store Connect.
- [ ] Tonight Mode parity on iOS (`ROADMAP.md`).
