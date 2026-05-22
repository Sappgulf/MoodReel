import Foundation

struct RecommendationContext {
    var selectedGenreIds: [Int] = []
    var providerMatchKeys: Set<String> = []
    var likedKeys: Set<String> = []
    var watchlistKeys: Set<String> = []
    var favoriteKeys: Set<String> = []
    var dislikedKeys: Set<String> = []
    var watchedKeys: Set<String> = []
    var hiddenKeys: Set<String> = []
}

struct ScoredRecommendation: Identifiable {
    let item: MediaResult
    let score: Double
    let reasons: [String]

    var id: String { mediaKey }

    private var mediaKey: String {
        "\(item.mediaType.rawValue):\(item.id)"
    }
}

enum RecommendationScoring {
    static func score(_ item: MediaResult, context: RecommendationContext) -> ScoredRecommendation {
        var score = item.voteAverage * 8 + min(item.popularity / 10, 20)
        var reasons: [String] = []
        let key = mediaKey(for: item)
        let genreIds = genreIds(for: item)

        if context.selectedGenreIds.contains(where: { genreIds.contains($0) }) {
            score += 18
            reasons.append("Matches your current mood")
        }
        if context.providerMatchKeys.contains(key) {
            score += 14
            reasons.append("Available on one of your services")
        }
        if context.likedKeys.contains(key) {
            score += 16
            reasons.append("Similar to titles you liked")
        }
        if context.watchlistKeys.contains(key) { score += 6 }
        if context.favoriteKeys.contains(key) { score += 6 }
        if item.voteAverage >= 7.5 {
            reasons.append("High audience rating")
        }

        if context.dislikedKeys.contains(key) {
            score -= 50
            reasons.append("You disliked similar picks")
        }
        if context.watchedKeys.contains(key) {
            score -= 35
            reasons.append("Already watched")
        }
        if context.hiddenKeys.contains(key) { score -= 80 }

        return ScoredRecommendation(item: item, score: score, reasons: Array(reasons.prefix(3)))
    }

    static func rank(_ items: [MediaResult], context: RecommendationContext) -> [ScoredRecommendation] {
        items
            .map { score($0, context: context) }
            .sorted { $0.score > $1.score }
    }

    static func explain(_ item: MediaResult, context: RecommendationContext) -> String {
        let reasons = score(item, context: context).reasons
        return reasons.isEmpty ? "Good overall fit for tonight" : reasons.joined(separator: " • ")
    }

    static func pickTonightSlots(from ranked: [ScoredRecommendation], mode: TonightPickMode) -> [TonightPick] {
        guard !ranked.isEmpty else { return [] }

        var used = Set<Int>()
        let labels = TonightPickLabel.allCases

        func takeUnique(where predicate: (ScoredRecommendation) -> Bool) -> MediaResult? {
            guard let found = ranked.first(where: { !used.contains($0.item.id) && predicate($0) }) else {
                return nil
            }
            used.insert(found.item.id)
            return found.item
        }

        let topScore = ranked[0].score
        let safe = takeUnique { $0.item.voteAverage >= 7 && $0.score >= topScore * 0.85 }
        let best = takeUnique { _ in true }
        let wild = takeUnique { entry in
            if mode == .adventurous {
                return entry.item.popularity < ranked[0].item.popularity
            }
            let fallbackIndex = min(2, ranked.count - 1)
            return entry.score <= ranked[fallbackIndex].score
        }

        return [safe, best, wild]
            .enumerated()
            .compactMap { index, item -> TonightPick? in
                guard let item else { return nil }
                let label = labels[min(index, labels.count - 1)]
                return TonightPick(
                    label: label,
                    item: item,
                    reason: explain(item, context: RecommendationContext())
                )
            }
    }

    private static func mediaKey(for item: MediaResult) -> String {
        "\(item.mediaType.rawValue):\(item.id)"
    }

    private static func genreIds(for item: MediaResult) -> [Int] {
        switch item {
        case .movie(let movie): return movie.genreIds ?? []
        case .tvShow(let show): return show.genreIds ?? []
        }
    }
}

enum TonightPickMode: String, CaseIterable, Identifiable {
    case safe
    case adventurous

    var id: String { rawValue }

    var title: String {
        switch self {
        case .safe: return "Safe pick"
        case .adventurous: return "Adventurous"
        }
    }
}

enum TonightPickLabel: String, CaseIterable {
    case safeBet = "Safe Bet"
    case bestMatch = "Best Match"
    case wildCard = "Wild Card"
}

struct TonightPick: Identifiable {
    let label: TonightPickLabel
    let item: MediaResult
    let reason: String

    var id: String { "\(label.rawValue)-\(item.mediaType.rawValue)-\(item.id)" }
}
