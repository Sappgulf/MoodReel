import Foundation

struct RecommendationScore {
    let score: Double
    let reasons: [String]
}

enum RecommendationScoring {
    static func mediaKey(for item: MediaResult) -> String {
        "\(item.mediaType.rawValue):\(item.id)"
    }

    static func score(
        item: MediaResult,
        selectedGenreIds: [Int] = [],
        providerMatchKeys: Set<String> = [],
        likedKeys: Set<String> = [],
        availableMinutes: Int? = nil
    ) -> RecommendationScore {
        var score = item.voteAverage * 8 + min(item.popularity / 10, 20)
        var reasons: [String] = []
        let key = mediaKey(for: item)

        let genreIds: [Int] = {
            switch item {
            case .movie(let m): return m.genreIds ?? []
            case .tvShow(let t): return t.genreIds ?? []
            }
        }()

        if selectedGenreIds.contains(where: { genreIds.contains($0) }) {
            score += 18
            reasons.append("Matches your current mood")
        }
        if providerMatchKeys.contains(key) {
            score += 14
            reasons.append("Available on your services")
        }
        if likedKeys.contains(key) {
            score += 16
            reasons.append("Similar to titles you liked")
        }
        if item.voteAverage >= 7.5 {
            reasons.append("High audience rating")
        }

        _ = availableMinutes

        return RecommendationScore(score: score, reasons: Array(reasons.prefix(3)))
    }

    static func rank(
        items: [MediaResult],
        selectedGenreIds: [Int] = [],
        providerMatchKeys: Set<String> = [],
        likedKeys: Set<String> = [],
        availableMinutes: Int? = nil,
        adventurous: Bool = false
    ) -> [MediaResult] {
        let sorted = items
            .map { item -> (MediaResult, RecommendationScore) in
                (item, score(
                    item: item,
                    selectedGenreIds: selectedGenreIds,
                    providerMatchKeys: providerMatchKeys,
                    likedKeys: likedKeys,
                    availableMinutes: availableMinutes
                ))
            }
            .sorted { $0.1.score > $1.1.score }
            .map(\.0)

        return pickThree(from: adventurous ? sorted.reversed() : sorted)
    }

    static func explain(
        item: MediaResult,
        selectedGenreIds: [Int] = [],
        providerMatchKeys: Set<String> = [],
        likedKeys: Set<String> = [],
        availableMinutes: Int? = nil
    ) -> String {
        let result = score(
            item: item,
            selectedGenreIds: selectedGenreIds,
            providerMatchKeys: providerMatchKeys,
            likedKeys: likedKeys,
            availableMinutes: availableMinutes
        )
        if result.reasons.isEmpty {
            return "Good overall fit for tonight"
        }
        return result.reasons.joined(separator: " • ")
    }

    private static func pickThree(from items: [MediaResult]) -> [MediaResult] {
        guard !items.isEmpty else { return [] }
        let last = items.count - 1
        let indices = [0, min(1, last), last]
        var seen = Set<String>()
        var picks: [MediaResult] = []
        for index in indices {
            let item = items[index]
            let key = mediaKey(for: item)
            if seen.contains(key) { continue }
            seen.insert(key)
            picks.append(item)
        }
        return picks
    }
}
