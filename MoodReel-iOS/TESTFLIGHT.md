# MoodReel iOS — TestFlight Preflight

Use this checklist before each TestFlight build. All items should pass on a physical device and the iOS Simulator.

## Build & signing

- [ ] Archive with Release configuration (`MoodReel` scheme).
- [ ] Version and build number incremented in Xcode.
- [ ] App icon and launch screen render correctly on iPhone and iPad sizes.
- [ ] `PrivacyInfo.xcprivacy` matches actual API usage (UserDefaults, network).

## API key flow

- [ ] Fresh install shows API key entry when no key is stored.
- [ ] Valid TMDB key unlocks Discover and Watchlist.
- [ ] Invalid key shows a clear error; user can reset key from Settings.
- [ ] Key is not logged to console in Release builds.

## Core journeys

- [ ] Discover: mood/filter changes update the feed; empty and error states are readable.
- [ ] Watchlist: add/remove items; movie and TV with the same numeric ID do not collide.
- [ ] Detail: poster, overview, and providers load for movie and TV routes.
- [ ] Settings: region and provider preferences persist after relaunch.

## Offline & resilience

- [ ] Airplane mode: app does not crash; cached screens remain usable where implemented.
- [ ] Background/foreground: in-flight requests cancel cleanly without duplicate cards.

## Accessibility

- [ ] VoiceOver reads tab labels and primary actions on Discover and Watchlist.
- [ ] Dynamic Type: no clipped titles on large content size categories.
- [ ] Dark mode: contrast remains acceptable on cards and navigation chrome.

## Legal & store metadata

- [ ] App Privacy questionnaire aligned with `PrivacyInfo.xcprivacy`.
- [ ] Support URL and marketing URL configured in App Store Connect.
- [ ] Screenshots and description mention TMDB attribution requirements.

## Post-upload

- [ ] Internal testing group receives build within 30 minutes.
- [ ] Smoke test on oldest supported iOS version in your deployment target.
- [ ] Note build number and git SHA in TestFlight release notes.
