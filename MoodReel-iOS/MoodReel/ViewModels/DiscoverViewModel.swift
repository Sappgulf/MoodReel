import Foundation

@MainActor
final class DiscoverViewModel: ObservableObject {
    enum FeedMode {
        case mood
        case trending
    }

    enum ContentFilter: String, CaseIterable, Identifiable {
        case all
        case movies
        case tvShows

        var id: String { rawValue }

        var title: String {
            switch self {
            case .all: return "All"
            case .movies: return "Movies"
            case .tvShows: return "TV Shows"
            }
        }
    }

    enum SortOption: String, CaseIterable, Identifiable {
        case popularity
        case rating
        case newest

        var id: String { rawValue }

        var title: String {
            switch self {
            case .popularity: return "Trending"
            case .rating: return "Top Rated"
            case .newest: return "Newest"
            }
        }
    }

    enum NightConstraint: String, CaseIterable, Identifiable {
        case under90
        case streamingNow
        case familyFriendly
        case noHorror
        case hiddenGem
        case highRating
        case newer
        case classic
        case lowCommitment
        case wildCard

        var id: String { rawValue }

        var title: String {
            switch self {
            case .under90: return "Under 90"
            case .streamingNow: return "Streaming now"
            case .familyFriendly: return "Family friendly"
            case .noHorror: return "No horror"
            case .hiddenGem: return "Hidden gem"
            case .highRating: return "High rating"
            case .newer: return "Newer"
            case .classic: return "Classic"
            case .lowCommitment: return "Low commitment"
            case .wildCard: return "Wild card"
            }
        }

        var systemImage: String {
            switch self {
            case .under90: return "clock"
            case .streamingNow: return "play.tv"
            case .familyFriendly: return "person.3"
            case .noHorror: return "moon.zzz"
            case .hiddenGem: return "sparkle.magnifyingglass"
            case .highRating: return "star.fill"
            case .newer: return "calendar.badge.clock"
            case .classic: return "film.stack"
            case .lowCommitment: return "sofa"
            case .wildCard: return "die.face.5"
            }
        }
    }

    @Published var selectedMood: MoodType = .happy
    @Published var query: String = ""
    @Published var items: [MediaResult] = []
    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var errorMessage: String?
    @Published var hasMorePages = true
    @Published var searchHistory: [SearchHistoryItem] = []
    @Published var moodHistory: [MoodEntry] = []
    @Published var lastResultUpdatedAt: Date?
    @Published var contentFilter: ContentFilter = .all
    @Published var minRating: Double = 0
    @Published var sortOption: SortOption = .popularity
    @Published var selectedConstraints: Set<NightConstraint> = [.streamingNow, .lowCommitment]

    private(set) var mode: FeedMode = .mood
    private var currentPage = 1
    private var latestRequestID = 0
    private var debouncedSearchTask: Task<Void, Never>?

    private let service: TMDBService
    private let searchHistoryStorageKey = "moodreel-search-history-v1"
    private let moodHistoryStorageKey = "moodreel-mood-history-v1"

    init(service: TMDBService = TMDBService()) {
        self.service = service
        loadPersistedInsights()
    }

    var topMoodCounts: [(MoodType, Int)] {
        let grouped = Dictionary(grouping: moodHistory, by: { $0.mood })
        return grouped
            .map { ($0.key, $0.value.count) }
            .sorted { $0.1 > $1.1 }
    }

    var distinctMoodsUsed: Int {
        Set(moodHistory.map(\.mood)).count
    }

    var filteredItems: [MediaResult] {
        let contentFiltered = items.filter { item in
            switch contentFilter {
            case .all:
                return true
            case .movies:
                return item.mediaType == .movie
            case .tvShows:
                return item.mediaType == .tv
            }
        }

        let ratingFiltered = contentFiltered.filter { $0.voteAverage >= minRating }

        let constrained = ratingFiltered.filter { item in
            constraintAllows(item)
        }

        return constrained.sorted { lhs, rhs in
            let lhsScore = tonightScore(for: lhs)
            let rhsScore = tonightScore(for: rhs)
            if lhsScore != rhsScore { return lhsScore > rhsScore }

            switch sortOption {
            case .popularity:
                return lhs.popularity > rhs.popularity
            case .rating:
                return lhs.voteAverage > rhs.voteAverage
            case .newest:
                return (lhs.releaseYear ?? "0000") > (rhs.releaseYear ?? "0000")
            }
        }
    }

    var tonightPicks: [MediaResult] {
        Array(filteredItems.prefix(3))
    }

    var constraintSummary: String {
        if selectedConstraints.isEmpty {
            return "No extra constraints"
        }
        return selectedConstraints
            .sorted { $0.title < $1.title }
            .map(\.title)
            .joined(separator: " • ")
    }

    func loadForSelectedMood() async {
        mode = .mood
        currentPage = 1
        hasMorePages = true
        await loadInitial(mode: mode)
    }

    func loadTrending() async {
        mode = .trending
        currentPage = 1
        hasMorePages = true
        await loadInitial(mode: mode)
    }

    func scheduleDebouncedSearch() {
        debouncedSearchTask?.cancel()
        debouncedSearchTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 420_000_000)
            guard let self else { return }
            if !Task.isCancelled {
                await self.loadForSelectedMood()
            }
        }
    }

    func selectMood(_ mood: MoodType) async {
        guard mood != selectedMood else { return }
        selectedMood = mood
        await loadForSelectedMood()
    }

    func useSearchHistory(_ item: SearchHistoryItem) async {
        query = item.query
        await loadForSelectedMood()
    }

    func clearSearchHistory() {
        searchHistory = []
        saveInsights()
    }

    func toggleConstraint(_ constraint: NightConstraint) {
        if selectedConstraints.contains(constraint) {
            selectedConstraints.remove(constraint)
        } else {
            selectedConstraints.insert(constraint)
        }

        switch constraint {
        case .highRating, .hiddenGem:
            minRating = max(minRating, constraint == .highRating ? 7.0 : 6.8)
            sortOption = .rating
        case .newer:
            sortOption = .newest
        case .familyFriendly:
            if selectedMood == .scared {
                selectedMood = .happy
            }
        default:
            break
        }
    }

    func loadNextPageIfNeeded(currentItem item: MediaResult) async {
        guard hasMorePages, !isLoadingMore, !isLoading else { return }
        guard let index = items.firstIndex(where: { $0.id == item.id && $0.mediaType == item.mediaType }) else { return }

        let thresholdIndex = items.index(items.endIndex, offsetBy: -6, limitedBy: items.startIndex) ?? items.startIndex
        if index < thresholdIndex { return }

        currentPage += 1
        isLoadingMore = true
        defer { isLoadingMore = false }

        let requestID = beginRequest()
        do {
            let nextPageItems = try await loadPage(mode: mode, page: currentPage)
            guard requestID == latestRequestID else { return }

            if nextPageItems.isEmpty {
                hasMorePages = false
                return
            }

            let existingKeys = Set(items.map(\.stableIdentifier))
            let dedupedPage = nextPageItems.filter { !existingKeys.contains($0.stableIdentifier) }
            if dedupedPage.isEmpty {
                hasMorePages = false
            } else {
                items.append(contentsOf: dedupedPage)
            }
        } catch {
            guard requestID == latestRequestID else { return }
            errorMessage = error.localizedDescription
        }
    }

    func randomPick() -> MediaResult? {
        filteredItems.randomElement() ?? items.randomElement()
    }

    private func loadInitial(mode: FeedMode) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        let requestID = beginRequest()

        do {
            let firstPageItems = try await loadPage(mode: mode, page: 1)
            guard requestID == latestRequestID else { return }
            items = firstPageItems
            hasMorePages = !firstPageItems.isEmpty
            lastResultUpdatedAt = Date()

            if mode == .mood {
                recordDiscovery(resultCount: firstPageItems.count)
            }
        } catch {
            guard requestID == latestRequestID else { return }
            errorMessage = error.localizedDescription
            items = []
        }
    }

    private func loadPage(mode: FeedMode, page: Int) async throws -> [MediaResult] {
        switch mode {
        case .mood:
            return try await service.discover(mood: selectedMood, query: query, page: page)
        case .trending:
            return try await service.trending(page: page)
        }
    }

    private func beginRequest() -> Int {
        latestRequestID += 1
        return latestRequestID
    }

    private func constraintAllows(_ item: MediaResult) -> Bool {
        let genres = item.genreIdsForScoring
        let year = Int(item.releaseYear ?? "") ?? 0

        if selectedConstraints.contains(.noHorror), genres.contains(27) {
            return false
        }
        if selectedConstraints.contains(.familyFriendly), genres.contains(27) {
            return false
        }
        if selectedConstraints.contains(.newer), year > 0 {
            let currentYear = Calendar.current.component(.year, from: Date())
            if year < currentYear - 8 { return false }
        }
        if selectedConstraints.contains(.classic), year > 0, year > 2005 {
            return false
        }

        return true
    }

    private func tonightScore(for item: MediaResult) -> Double {
        let genres = item.genreIdsForScoring
        let year = Int(item.releaseYear ?? "") ?? 0
        let currentYear = Calendar.current.component(.year, from: Date())
        var score = item.voteAverage * 8
        score += min(log10(max(item.popularity, 1)) * 5, 14)
        score += min(log10(Double(max(item.voteCountForScoring, 1))) * 4, 18)

        let moodHits = genres.filter { selectedMood.genreIds.contains($0) }.count
        score += Double(moodHits * 18)

        if selectedConstraints.contains(.streamingNow) {
            // Provider availability is verified on detail; keep this as a mild list-level confidence boost.
            score += 4
        }
        if selectedConstraints.contains(.familyFriendly), genres.contains(where: { [16, 10751].contains($0) }) {
            score += 22
        }
        if selectedConstraints.contains(.hiddenGem), item.voteAverage >= 7, item.popularity < 90 {
            score += 20
        }
        if selectedConstraints.contains(.highRating), item.voteAverage >= 7.4 {
            score += 22
        }
        if selectedConstraints.contains(.newer), year >= currentYear - 5 {
            score += 16
        }
        if selectedConstraints.contains(.classic), year > 0, year <= 2005 {
            score += year <= 1985 ? 22 : 16
        }
        if selectedConstraints.contains(.lowCommitment), item.mediaType == .movie {
            score += 6
        }
        if selectedConstraints.contains(.wildCard), genres.contains(where: { [14, 878, 9648, 99].contains($0) }) {
            score += 18
        }

        return score
    }

    private func recordDiscovery(resultCount: Int) {
        let now = Date()
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)

        // Avoid noisy duplicate entries for near-identical refreshes.
        if let last = moodHistory.last,
           last.mood == selectedMood,
           (last.note ?? "") == trimmedQuery,
           now.timeIntervalSince(last.date) < 120 {
            return
        }

        moodHistory.append(
            MoodEntry(
                mood: selectedMood,
                date: now,
                intensity: min(1.0, max(0.35, Double(resultCount) / 20.0)),
                note: trimmedQuery.isEmpty ? nil : trimmedQuery
            )
        )

        if moodHistory.count > 180 {
            moodHistory.removeFirst(moodHistory.count - 180)
        }

        if !trimmedQuery.isEmpty {
            if let existingIndex = searchHistory.firstIndex(where: { $0.query.caseInsensitiveCompare(trimmedQuery) == .orderedSame }) {
                searchHistory[existingIndex] = SearchHistoryItem(
                    id: searchHistory[existingIndex].id,
                    query: trimmedQuery,
                    date: now,
                    resultCount: resultCount
                )
            } else {
                searchHistory.append(
                    SearchHistoryItem(query: trimmedQuery, date: now, resultCount: resultCount)
                )
            }

            searchHistory.sort { $0.date > $1.date }
            if searchHistory.count > 15 {
                searchHistory.removeLast(searchHistory.count - 15)
            }
        }

        saveInsights()
    }

    private func loadPersistedInsights() {
        let defaults = UserDefaults.standard

        if let moodData = defaults.data(forKey: moodHistoryStorageKey),
           let decodedMoods = try? JSONDecoder().decode([MoodEntry].self, from: moodData) {
            moodHistory = decodedMoods
        }

        if let searchData = defaults.data(forKey: searchHistoryStorageKey),
           let decodedSearch = try? JSONDecoder().decode([SearchHistoryItem].self, from: searchData) {
            searchHistory = decodedSearch
        }
    }

    private func saveInsights() {
        let defaults = UserDefaults.standard
        if let moodsData = try? JSONEncoder().encode(moodHistory) {
            defaults.set(moodsData, forKey: moodHistoryStorageKey)
        }
        if let searchData = try? JSONEncoder().encode(searchHistory) {
            defaults.set(searchData, forKey: searchHistoryStorageKey)
        }
    }
}

extension MediaResult {
    var stableIdentifier: String {
        "\(mediaType.rawValue)-\(id)"
    }

    var genreIdsForScoring: [Int] {
        switch self {
        case .movie(let movie):
            return movie.genreIds ?? []
        case .tvShow(let show):
            return show.genreIds ?? []
        }
    }

    var voteCountForScoring: Int {
        switch self {
        case .movie(let movie):
            return movie.voteCount
        case .tvShow(let show):
            return show.voteCount
        }
    }
}
