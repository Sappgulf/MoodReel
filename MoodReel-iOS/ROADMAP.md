# MoodReel iOS Roadmap

## Tonight Mode parity
1. Add `TonightViewModel` with local scoring parity against web `recommendationScoring`.
2. Add `TonightView` with mood/time/group/safety controls.
3. Present 3 cards: Safe Bet, Best Match, Wild Card with "Why this pick?" labels.

## Taste graph + provider setup
1. Extend `WatchlistStore` to persist liked/disliked keys by media type.
2. Add provider preferences to Settings with region-aware options.
3. Add insights visualization for mood-to-genre affinity.

## Reliability and shipping
1. Add iCloud sync abstraction for watchlist and taste profile.
2. Add crash reporting behind optional feature flag.
3. Finish App Privacy labels and data disclosure mapping.
4. Add TestFlight checklist: API key flow, offline mode, deep links, onboarding.
