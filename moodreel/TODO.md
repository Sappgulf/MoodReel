# MoodReel Polish Todo

## Completed in this branch

- [x] Rework the Discover first viewport into a cinematic hero with a featured pick.
- [x] Tighten the brand system around a clearer noir palette and display typography.
- [x] Reduce card reliance on hover by keeping core metadata visible by default.
- [x] Add a global quick-action palette for navigation and common actions.
- [x] Improve loading states with a hero skeleton that matches the new layout.
- [x] Upgrade empty states with clearer, more actionable copy.
- [x] Improve the PWA install prompt lifecycle cleanup.
- [x] Make toast dismissal keyboard-accessible.
- [x] Add missing `type="button"` safeguards to interactive controls in key views.

## Follow-up ideas

- [x] Consider a dedicated share card exporter for mood-based social previews.
- [x] Consolidate remaining CSS transitions from `all` to explicit properties.
- [x] Review whether the bottom nav should collapse further on smaller phones.
- [x] Re-center Discover around Tonight Mode with mood presets, constraint chips, and three confident picks.
- [x] Move recommendation scoring into a pure tested utility.
- [x] Add media-type-aware watchlist/watched keys for movie-vs-TV collisions.
- [x] Add iOS Discover parity for Tonight constraints and top-three picks.
- [x] Add a dedicated `/tonight` decision-engine route with vibe, runtime, content type, watching context, services-only, risk preference, rating, and hide watched/disliked controls.
- [x] Add route smoke coverage for the main app routes.
- [x] Upgrade iOS Tonight copy to show Safe Bet / Best Match / Wild Card confidence and reasons.
- [x] Build the dedicated native `TonightView` and `TonightViewModel` described in `../MoodReel-iOS/ROADMAP.md`.
- [x] Add deterministic Playwright TMDB fixtures for the `/tonight` three-pick decision flow.

## Next phase candidates

- [x] Add runtime/trailer enrichment for Tonight cards when TMDB detail data is available.
- [x] Persist preferred Tonight constraints per user profile.
- [ ] Add Playwright coverage for Pick Between These compare decisions.
- [ ] Add native provider preferences and region/service filtering for iOS Tonight parity.
