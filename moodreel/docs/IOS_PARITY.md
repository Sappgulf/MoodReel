# iOS / Safari parity checklist

MoodReel is a Vite + React PWA. Safari on iOS differs from desktop Chrome; use this list when changing storage, media, install flow, or layout.

## PWA and install

- **Add to Home Screen**: `manifest.json` icons and `display` mode should match what you test in Safari.
- **Service worker**: After deploy, confirm offline shell and that new builds invalidate caches (build stamps `CACHE_VERSION` in `build/service-worker.js`).
- **Standalone**: In standalone, `display-mode: standalone` media query may affect safe areas and chrome.

## Viewport and safe area

- Respect **safe-area-inset-\*** for notched devices when fixing full-bleed UI or fixed footers.
- Avoid `100vh` traps; prefer `dvh` / `svh` where supported, or explicit min-height patterns used elsewhere in the app.

## Storage

- **localStorage** is subject to **private / cross-site** limits; large JSON blobs can fail silently.
- Central keys live in `src/storage/storageKeys.js`; migrations should bump `STORAGE_SCHEMA_VERSION` and document one-time migration steps here if needed.

## APIs with partial iOS support

- **Vibration** (`navigator.vibrate`): no-op or limited on iOS; feature is optional; do not rely on it for core UX.
- **Notifications / Push**: Web Push on iOS has narrow support; keep permission flows graceful.
- **Clipboard** (`navigator.clipboard`): may require user gesture and HTTPS; already handled with fallbacks where implemented.

## Media

- **Autoplay**: assume muted or user-gesture-gated audio; sound hooks should fail closed.
- **Video embeds / TMDB**: third-party iframes may differ; test one representative detail page on device.

## Testing

- Smoke on **Safari iOS** and **Chrome iOS** after changes to navigation, gestures, or fixed positioning.
- Use `npm run build` locally and spot-check `build/` plus PWA install from a staging URL when possible.
