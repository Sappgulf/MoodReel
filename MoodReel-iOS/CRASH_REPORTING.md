# MoodReel iOS — Crash Reporting Plan

## Goal

Capture production crashes and non-fatal errors without collecting unnecessary personal data.

## Recommended approach (phased)

### Phase 1 — Xcode Organizer only (now)

- Rely on **Xcode Organizer → Crashes** for TestFlight and App Store builds.
- No third-party SDK; zero extra privacy disclosures.
- Action: symbolicate dSYMs for each uploaded build.

### Phase 2 — Optional MetricKit (low overhead)

- Enable `MXMetricManager` subscriber for hang and crash diagnostics payloads.
- Surface only aggregated metrics in a future Settings → Diagnostics screen (opt-in).
- No user IDs; no TMDB API keys in reports.

### Phase 3 — Optional third-party (if volume grows)

Candidates: Firebase Crashlytics, Sentry (Swift SDK). Requirements before adoption:

- Crash reports must exclude API keys, search queries, and watchlist titles unless hashed.
- EU/US privacy policy updated with processor name and data retention.
- Feature flag: `DiagnosticsEnabled` default **off** until user opts in.

## Implementation sketch

```swift
// MoodReel/Services/DiagnosticsService.swift (future)
enum DiagnosticsService {
    static var isEnabled: Bool { UserDefaults.standard.bool(forKey: "diagnosticsEnabled") }

    static func record(error: Error, context: [String: String] = [:]) {
        guard isEnabled else { return }
        // redact keys: apiKey, token, query
    }
}
```

## Redaction rules

| Field | Rule |
| --- | --- |
| TMDB API key | Never attach to reports |
| Search / mood text | Omit or hash |
| User email | Not collected |
| Device model / OS version | Allowed |

## Verification

- [ ] Force a test crash in DEBUG only; confirm Release builds do not expose debug crash UI.
- [ ] Confirm crash logs in Organizer symbolicate to Swift file/line after dSYM upload.
