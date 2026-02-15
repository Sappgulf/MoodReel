import Foundation

@MainActor
final class DiscoverViewModel: ObservableObject {
    enum FeedMode {
        case mood
        case trending
    }

    @Published var selectedMood: MoodType = .happy
    @Published var query: String = ""
    @Published var items: [MediaResult] = []
    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var errorMessage: String?
    @Published var hasMorePages = true

    private(set) var mode: FeedMode = .mood
    private var currentPage = 1
    private var latestRequestID = 0
    private var debouncedSearchTask: Task<Void, Never>?

    private let service: TMDBService

    init(service: TMDBService = TMDBService()) {
        self.service = service
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
        items.randomElement()
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
}

extension MediaResult {
    var stableIdentifier: String {
        "\(mediaType.rawValue)-\(id)"
    }
}
