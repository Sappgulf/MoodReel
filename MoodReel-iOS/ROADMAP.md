# MoodReel iOS Roadmap

## Current Direction

MoodReel iOS should match the web product direction: a cinematic decision engine centered on Tonight Mode.

Current safe parity:

- The main tab is labeled Tonight.
- DiscoverView exposes mood, content type, rating, sort, and night constraints.
- The Tonight Mode section renders Safe Bet, Best Match, and Wild Card with confidence and plain-language reasons.
- TMDB API keys remain Keychain-backed through `APIKeyStore`.
- `TMDBService` keeps its response cache and URLSession flow intact.

## Next Native Phase

Build a dedicated native Tonight Mode surface without replacing the existing Discover feed:

- `Views/TonightView.swift`
  - Mood/vibe input.
  - Available time selector.
  - Content type segmented control.
  - Solo / Date / Family / Friends context.
  - Services-only setting once provider preferences exist natively.
  - Safe / Balanced / Adventurous preference.
  - Safe Bet / Best Match / Wild Card cards with reason text and save/detail actions.

- `ViewModels/TonightViewModel.swift`
  - Own a `TonightDecisionPick` model.
  - Reuse `TMDBService.discover`, `WatchlistStore`, and the existing scoring helpers in `DiscoverViewModel`.
  - Keep deterministic ranking and avoid network calls from `body`.

- `Models/TonightDecisionPick.swift` if the model grows beyond a view-model-local struct.

## Guardrails

- Do not hardcode TMDB API keys.
- Do not remove the Keychain flow in `Config/TMDBConfig.swift`.
- Do not bypass the existing cache behavior in `Services/TMDBService.swift`.
- Update `MoodReel.xcodeproj/project.pbxproj` whenever new Swift files are added, or regenerate the project from `project.yml` if XcodeGen is the chosen workflow.
