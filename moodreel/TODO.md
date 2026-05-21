# MoodReel Backlog

## P0 — must fix before sharing

- [x] Replace legacy `react-scripts` unit test runner with Vitest.
- [x] Sync `package-lock.json` with Vitest/jsdom dependencies (CI `npm ci`).
- [x] Repair broken `Tonight.jsx` page (syntax / incomplete merge).
- [ ] Add CI-safe E2E strategy (mocked API or nightly key-injected run) — Playwright smoke runs in CI without TMDB key.

## P1 — quality polish

- [x] Remove remaining broad CSS transitions (`transition: all`) with explicit properties.
- [x] Improve offline fallback UX copy and add dedicated offline screen.
- [x] Provider/filter tests with TMDB fixtures (`providerFilter`, `providerService`).
- [ ] Add explicit accessibility regression checks for keyboard focus order.

## P2 — product additions

- Share card exporter for mood-based social previews.
- Expanded provider-region presets and onboarding.
- Better multi-profile local persistence.

## P3 — iOS/TestFlight readiness

- Add TestFlight preflight checklist and release metadata templates.
- Add crash/reporting instrumentation plan.
- Complete privacy nutrition labels and legal content review.
