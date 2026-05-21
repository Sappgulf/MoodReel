# MoodReel iOS Roadmap

## Current Direction

MoodReel iOS should match the web product direction: a cinematic decision engine centered on Tonight Mode.

Current safe parity:

- The first tab is a dedicated native `TonightView`.
- DiscoverView exposes mood, content type, rating, sort, and night constraints.
- The Tonight Mode section renders Safe Bet, Best Match, and Wild Card with confidence and plain-language reasons.
- Native Tonight Mode supports vibe, mood lane, available-time, content type, Solo / Date / Family / Friends context, safe/balanced/adventurous preference, minimum rating, hide watched/disliked controls, region/service chips, and services-only filtering.
- Native Tonight cards include confidence, reason text, save actions, details navigation, and a share card.
- TMDB API keys remain Keychain-backed through `APIKeyStore`.
- `TMDBService` keeps its response cache and URLSession flow intact.

## Shipped Native Phase

The dedicated native Tonight Mode surface now exists without replacing the existing Discover feed:

- `Views/TonightView.swift`
  - Owns the SwiftUI decision flow and first-tab presentation.
  - Provides mood/vibe input, time selector, content segmented control, viewing context, risk preference, rating, watched/disliked hiding, Safe Bet / Best Match / Wild Card cards, save/detail actions, and sharing.

- `ViewModels/TonightViewModel.swift`
  - Owns the `TonightPick` model and deterministic ranking.
  - Reuses `TMDBService.discover`, `WatchlistStore`, `TasteProfileStore`, and existing media scoring metadata.
  - Keeps network calls in explicit async actions, not SwiftUI `body`.

- `Models/TonightDecisionPick.swift` if the model grows beyond a view-model-local struct.

## Next Native Phase

- Add runtime enrichment from detail calls for the three native picks.
- Add native UI tests or snapshot coverage for the Tonight tab once the project has a test target.

## Guardrails

- Do not hardcode TMDB API keys.
- Do not remove the Keychain flow in `Config/TMDBConfig.swift`.
- Do not bypass the existing cache behavior in `Services/TMDBService.swift`.
- Update `MoodReel.xcodeproj/project.pbxproj` whenever new Swift files are added, or regenerate the project from `project.yml` if XcodeGen is the chosen workflow.
