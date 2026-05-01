# MoodReel Backlog

## P0 — must fix before sharing

- Replace legacy `react-scripts` unit test runner with Vitest to remove dual-tooling drift.
- Add deterministic provider/filter integration tests with TMDB fixtures.
- Add CI-safe E2E strategy (mocked API or nightly key-injected run).

## P1 — quality polish

- Remove remaining broad CSS transitions (`transition: all`) with explicit properties.
- Improve offline fallback UX copy and add dedicated offline screen.
- Add explicit accessibility regression checks for keyboard focus order.

## P2 — product additions

- Share card exporter for mood-based social previews.
- Expanded provider-region presets and onboarding.
- Better multi-profile local persistence.

## P3 — iOS/TestFlight readiness

- Add TestFlight preflight checklist and release metadata templates.
- Add crash/reporting instrumentation plan.
- Complete privacy nutrition labels and legal content review.
