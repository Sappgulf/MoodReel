import Foundation

@MainActor
final class TonightViewModel: ObservableObject {
    enum RuntimeOption: String, CaseIterable, Identifiable {
        case any
        case short
        case standard
        case flexible

        var id: String { rawValue }

        var title: String {
            switch self {
            case .any: return "Any"
            case .short: return "90 min"
            case .standard: return "2 hours"
            case .flexible: return "Flexible"
            }
        }

        var subtitle: String {
            switch self {
            case .any: return "No runtime bias"
            case .short: return "Low commitment"
            case .standard: return "Movie night"
            case .flexible: return "Epic is fine"
            }
        }
    }

    enum ContentKind: String, CaseIterable, Identifiable {
        case all
        case movies
        case tv

        var id: String { rawValue }

        var title: String {
            switch self {
            case .all: return "All"
            case .movies: return "Movies"
            case .tv: return "TV"
            }
        }

        func allows(_ item: MediaResult) -> Bool {
            switch self {
            case .all: return true
            case .movies: return item.mediaType == .movie
            case .tv: return item.mediaType == .tv
            }
        }
    }

    enum WatchingContext: String, CaseIterable, Identifiable {
        case solo
        case date
        case family
        case friends

        var id: String { rawValue }

        var title: String {
            switch self {
            case .solo: return "Solo"
            case .date: return "Date"
            case .family: return "Family"
            case .friends: return "Friends"
            }
        }

        var mood: MoodType {
            switch self {
            case .solo: return .curious
            case .date: return .romantic
            case .family: return .happy
            case .friends: return .excited
            }
        }

        var genreBoosts: [Int] {
            switch self {
            case .solo: return [18, 53, 9648, 878, 99]
            case .date: return [10749, 18, 35, 10402]
            case .family: return [16, 10751, 35, 12]
            case .friends: return [35, 28, 12, 53]
            }
        }

        var toneTokens: [String] {
            switch self {
            case .solo: return ["quiet", "personal", "mystery", "journey"]
            case .date: return ["love", "romance", "relationship", "beautiful"]
            case .family: return ["family", "friendship", "adventure", "heartwarming"]
            case .friends: return ["team", "friends", "party", "mission", "heist"]
            }
        }
    }

    enum RiskPreference: String, CaseIterable, Identifiable {
        case safe
        case balanced
        case adventurous

        var id: String { rawValue }

        var title: String {
            switch self {
            case .safe: return "Safer"
            case .balanced: return "Balanced"
            case .adventurous: return "Wild"
            }
        }
    }

    enum PickSlot: String, CaseIterable {
        case safe
        case best
        case wild

        var title: String {
            switch self {
            case .safe: return "Safe Bet"
            case .best: return "Best Match"
            case .wild: return "Wild Card"
            }
        }
    }

    struct TonightPick: Identifiable {
        let id: String
        let slot: PickSlot
        let item: MediaResult
        let confidence: Int
        let reason: String
        let reasons: [String]
        let caveat: String?

        var slotTitle: String { slot.title }

        var confidenceLabel: ConfidenceLabel {
            ConfidenceLabel.label(for: confidence)
        }

        var accessibilitySummary: String {
            var parts: [String] = []
            parts.append("\(slot.title): \(item.displayTitle).")
            parts.append("Confidence \(confidence) percent.")
            if !reasons.isEmpty {
                parts.append("Why: \(reasons.joined(separator: ", ")).")
            }
            if let caveat, !caveat.isEmpty {
                parts.append("Caveat: \(caveat).")
            }
            return parts.joined(separator: " ")
        }

        static func formatConfidenceLabel(score: Double) -> String {
            ConfidenceLabel.formatConfidenceLabel(score: score)
        }
    }

    private struct Scorecard {
        let item: MediaResult
        let score: Double
        let safeScore: Double
        let wildScore: Double
        let reasons: [String]
        let caveats: [String]
    }

    @Published var vibe: String = "cozy crowd pleasing"
    @Published var selectedMood: MoodType = .relaxed
    @Published var runtimeOption: RuntimeOption = .standard
    @Published var contentKind: ContentKind = .all
    @Published var watchingContext: WatchingContext = .friends
    @Published var riskPreference: RiskPreference = .balanced
    @Published var minimumRating: Double = 6.5
    @Published var hideDisliked = true
    @Published var hideWatched = true
    @Published var servicesOnly = false
    @Published private(set) var picks: [TonightPick] = []
    @Published private(set) var candidateCount = 0
    @Published private(set) var lastUpdatedAt: Date?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service: TMDBService

    init(service: TMDBService = TMDBService()) {
        self.service = service
    }

    var shareText: String {
        let pickLines = picks.map { pick in
            "\(pick.slotTitle): \(pick.item.displayTitle) - \(pick.reason)"
        }
        return (["MoodReel Tonight", "Vibe: \(vibeOrMoodLabel)"] + pickLines).joined(separator: "\n")
    }

    var vibeOrMoodLabel: String {
        let trimmed = vibe.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? selectedMood.displayName : trimmed
    }

    func findPicks(
        watchlist: [WatchlistItem],
        likedIds: Set<String>,
        dislikedIds: Set<String>,
        region: String,
        selectedServiceIds: Set<Int>
    ) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            async let moodResults = service.discover(mood: selectedMood, query: "", page: 1)
            async let contextResults = service.discover(mood: watchingContext.mood, query: "", page: 1)
            let candidates = dedupe(try await moodResults + contextResults)
            let ranked = rank(
                candidates,
                watchlist: watchlist,
                likedIds: likedIds,
                dislikedIds: dislikedIds
            )
            let filtered = await applyProviderFilter(
                to: ranked,
                region: region,
                selectedServiceIds: selectedServiceIds
            )

            candidateCount = filtered.count
            picks = buildPicks(from: filtered)
            lastUpdatedAt = Date()

            if picks.count < 3 {
                if servicesOnly, selectedServiceIds.isEmpty {
                    errorMessage = "Choose at least one streaming service for services-only picks."
                } else if servicesOnly {
                    errorMessage = "MoodReel needs a broader vibe or fewer service filters to make all three picks."
                } else {
                    errorMessage = "MoodReel needs a broader vibe or fewer filters to make all three picks."
                }
            }
        } catch {
            picks = []
            candidateCount = 0
            errorMessage = error.localizedDescription
        }
    }

    func resetFilters() {
        runtimeOption = .standard
        contentKind = .all
        watchingContext = .friends
        riskPreference = .balanced
        minimumRating = 6.5
        hideDisliked = true
        hideWatched = true
        servicesOnly = false
    }

    private func applyProviderFilter(
        to ranked: [Scorecard],
        region: String,
        selectedServiceIds: Set<Int>
    ) async -> [Scorecard] {
        guard servicesOnly else { return ranked }
        guard !selectedServiceIds.isEmpty else { return [] }

        let lookupItems = ranked.prefix(18)
        var providersByKey: [String: RegionProviders] = [:]

        await withTaskGroup(of: (String, RegionProviders?).self) { group in
            for scorecard in lookupItems {
                let item = scorecard.item
                let key = item.stableIdentifier
                group.addTask { [service] in
                    let providers = await service.watchProviders(for: item.route, region: region)
                    return (key, providers)
                }
            }

            for await (key, providers) in group {
                if let providers {
                    providersByKey[key] = providers
                }
            }
        }

        return ranked.compactMap { scorecard -> Scorecard? in
            guard let providers = providersByKey[scorecard.item.stableIdentifier] else {
                return nil
            }
            guard providers.matchesAnyService(selectedServiceIds) else {
                return nil
            }

            var reasons = scorecard.reasons
            if !reasons.contains(where: { $0.contains("streaming service") }) {
                reasons.insert("available on your streaming services", at: 0)
            }

            return Scorecard(
                item: scorecard.item,
                score: scorecard.score + 12,
                safeScore: scorecard.safeScore + 8,
                wildScore: scorecard.wildScore,
                reasons: Array(reasons.prefix(4)),
                caveats: scorecard.caveats
            )
        }
        .sorted { lhs, rhs in
            if lhs.score != rhs.score { return lhs.score > rhs.score }
            if lhs.item.voteAverage != rhs.item.voteAverage {
                return lhs.item.voteAverage > rhs.item.voteAverage
            }
            return lhs.item.popularity > rhs.item.popularity
        }
    }

    private func rank(
        _ candidates: [MediaResult],
        watchlist: [WatchlistItem],
        likedIds: Set<String>,
        dislikedIds: Set<String>
    ) -> [Scorecard] {
        let watchedKeys = Set(watchlist.filter(\.isWatched).map(tasteKey))
        let savedKeys = Set(watchlist.map(tasteKey))

        return candidates.compactMap { item in
            guard contentKind.allows(item) else { return nil }
            guard item.voteAverage >= minimumRating else { return nil }

            let key = tasteKey(for: item)
            if hideDisliked, dislikedIds.contains(key) { return nil }
            if hideWatched, watchedKeys.contains(key) { return nil }

            return score(
                item,
                key: key,
                savedKeys: savedKeys,
                likedIds: likedIds,
                dislikedIds: dislikedIds
            )
        }
        .sorted { lhs, rhs in
            if lhs.score != rhs.score { return lhs.score > rhs.score }
            if lhs.item.voteAverage != rhs.item.voteAverage {
                return lhs.item.voteAverage > rhs.item.voteAverage
            }
            return lhs.item.popularity > rhs.item.popularity
        }
    }

    private func score(
        _ item: MediaResult,
        key: String,
        savedKeys: Set<String>,
        likedIds: Set<String>,
        dislikedIds: Set<String>
    ) -> Scorecard {
        let genres = item.genreIdsForScoring
        let text = "\(item.displayTitle) \(item.overview ?? "")".lowercased()
        let voteCount = Double(max(item.voteCountForScoring, 1))
        var score = item.voteAverage * 8
        var safeScore = item.voteAverage * 7 + min(log10(voteCount) * 7, 24)
        var wildScore = 0.0
        var reasons: [String] = []
        var caveats: [String] = []

        score += min(log10(max(item.popularity, 1)) * 5, 14)
        score += min(log10(voteCount) * 4, 18)

        let moodHits = genres.filter { selectedMood.genreIds.contains($0) }.count
        if moodHits > 0 {
            score += Double(moodHits * 18)
            safeScore += Double(moodHits * 4)
            reasons.append("matches \(selectedMood.displayName.lowercased())")
        }

        let contextGenreHits = genres.filter { watchingContext.genreBoosts.contains($0) }.count
        let contextTextHits = watchingContext.toneTokens.filter { text.contains($0) }.count
        if contextGenreHits > 0 || contextTextHits > 0 {
            score += Double(contextGenreHits * 10 + contextTextHits * 3)
            reasons.append("works for \(watchingContext.title.lowercased()) viewing")
        }

        let vibeTokens = tokenize(vibe).prefix(8)
        let vibeHits = vibeTokens.filter { text.contains($0) }.count
        if vibeHits > 0 {
            score += Double(vibeHits * 4)
            reasons.append("story tone fits the vibe")
        }

        if likedIds.contains(key) {
            score += 45
            safeScore += 20
            reasons.append("you liked this signal")
        }
        if savedKeys.contains(key) {
            score += 12
            reasons.append("already on your radar")
        }
        if dislikedIds.contains(key) {
            score -= 70
            caveats.append("similar to a disliked title")
        }

        switch runtimeOption {
        case .any:
            break
        case .short:
            if item.mediaType == .movie {
                score += 8
                safeScore += 5
                reasons.append("low-commitment movie pick")
            } else {
                caveats.append("episode runtime varies")
            }
        case .standard:
            if item.mediaType == .movie {
                score += 5
                reasons.append("single-sitting pick")
            }
        case .flexible:
            if item.popularity > 120 || item.voteCountForScoring > 1_500 {
                score += 6
                reasons.append("big-night confidence")
            }
        }

        let hasWildGenre = genres.contains { [14, 878, 9648, 99].contains($0) }
        if hasWildGenre || (item.popularity < 85 && item.voteAverage >= 6.7) {
            wildScore += 28
        }

        switch riskPreference {
        case .safe:
            score += safeScore * 0.18
            if hasWildGenre, item.voteCountForScoring < 500 {
                score -= 12
                caveats.append("less proven for safe mode")
            }
        case .balanced:
            score += safeScore * 0.08 + wildScore * 0.06
        case .adventurous:
            score += wildScore * 0.25
            if hasWildGenre {
                reasons.append("left-turn energy")
            }
        }

        if reasons.isEmpty {
            reasons.append("strongest available fit")
        }

        return Scorecard(
            item: item,
            score: score,
            safeScore: safeScore,
            wildScore: wildScore,
            reasons: Array(reasons.prefix(4)),
            caveats: caveats
        )
    }

    private func buildPicks(from ranked: [Scorecard]) -> [TonightPick] {
        var remaining = ranked
        var results: [TonightPick] = []

        if let safe = popBest(from: &remaining, slot: .safe) {
            results.append(safe)
        }
        if let best = popBest(from: &remaining, slot: .best) {
            results.append(best)
        }
        if let wild = popBest(from: &remaining, slot: .wild) {
            results.append(wild)
        }

        return results
    }

    private func popBest(from scorecards: inout [Scorecard], slot: PickSlot) -> TonightPick? {
        guard !scorecards.isEmpty else { return nil }

        let selectedIndex: Int
        switch slot {
        case .safe:
            selectedIndex = scorecards.indices.max { lhs, rhs in
                scorecards[lhs].safeScore < scorecards[rhs].safeScore
            } ?? scorecards.startIndex
        case .best:
            selectedIndex = scorecards.startIndex
        case .wild:
            selectedIndex = scorecards.indices.max { lhs, rhs in
                scorecards[lhs].wildScore < scorecards[rhs].wildScore
            } ?? scorecards.startIndex
        }

        let scorecard = scorecards.remove(at: selectedIndex)
        let confidence = confidencePercent(for: scorecard, slot: slot)
        return TonightPick(
            id: "\(slot.rawValue)-\(scorecard.item.stableIdentifier)",
            slot: slot,
            item: scorecard.item,
            confidence: confidence,
            reason: reason(for: scorecard, slot: slot),
            reasons: Array(scorecard.reasons.prefix(2)),
            caveat: scorecard.caveats.first
        )
    }

    private func confidencePercent(for scorecard: Scorecard, slot: PickSlot) -> Int {
        let base: Double
        switch slot {
        case .safe: base = 70 + min(scorecard.safeScore / 8, 22)
        case .best: base = 72 + min(scorecard.score / 10, 24)
        case .wild: base = 66 + min(scorecard.wildScore / 2, 24)
        }
        return min(98, max(58, Int(base.rounded())))
    }

    private func reason(for scorecard: Scorecard, slot: PickSlot) -> String {
        let reasonText = scorecard.reasons.prefix(3).joined(separator: ", ")
        return "\(slot.title): \(reasonText)."
    }

    private func dedupe(_ items: [MediaResult]) -> [MediaResult] {
        var seen = Set<String>()
        return items.filter { item in
            if seen.contains(item.stableIdentifier) { return false }
            seen.insert(item.stableIdentifier)
            return true
        }
    }

    private func tokenize(_ value: String) -> [String] {
        value
            .lowercased()
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { $0.count >= 3 }
    }

    private func tasteKey(for item: MediaResult) -> String {
        "\(item.id)-\(item.mediaType.rawValue)"
    }

    private func tasteKey(for item: WatchlistItem) -> String {
        "\(item.mediaId)-\(item.mediaType.rawValue)"
    }
}
