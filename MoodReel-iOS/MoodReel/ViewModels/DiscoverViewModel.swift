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

        switch sortOption {
        case .popularity:
            return ratingFiltered.sorted { $0.popularity > $1.popularity }
        case .rating:
            return ratingFiltered.sorted { $0.voteAverage > $1.voteAverage }
        case .newest:
            return ratingFiltered.sorted { lhs, rhs in
                (lhs.releaseYear ?? "0000") > (rhs.releaseYear ?? "0000")
            }
        }
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
}
