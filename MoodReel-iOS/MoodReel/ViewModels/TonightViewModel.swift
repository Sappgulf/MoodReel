import Foundation

@MainActor
final class TonightViewModel: ObservableObject {
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

    @Published var selectedMood: MoodType = .relaxed
    @Published var availableMinutes: Int = 120
    @Published var contentFilter: ContentFilter = .all
    @Published var pickMode: TonightPickMode = .safe
    @Published var picks: [TonightPick] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service: TMDBService
    private var latestRequestID = 0

    init(service: TMDBService = TMDBService()) {
        self.service = service
    }

    func loadTonightPicks() async {
        let requestID = latestRequestID + 1
        latestRequestID = requestID

        isLoading = true
        errorMessage = nil
        picks = []

        do {
            let results = try await service.discover(mood: selectedMood)
            guard requestID == latestRequestID else { return }

            let filtered = filterContent(results)
            let context = RecommendationContext(selectedGenreIds: selectedMood.genreIds)
            let ranked = RecommendationScoring.rank(filtered, context: context)
            let slots = RecommendationScoring.pickTonightSlots(from: ranked, mode: pickMode)
            picks = slots.map { slot in
                TonightPick(
                    label: slot.label,
                    item: slot.item,
                    reason: RecommendationScoring.explain(slot.item, context: context)
                )
            }

            if picks.isEmpty {
                errorMessage = "No picks yet. Try another mood."
            }
        } catch {
            guard requestID == latestRequestID else { return }
            errorMessage = error.localizedDescription
        }

        guard requestID == latestRequestID else { return }
        isLoading = false
    }

    private func filterContent(_ items: [MediaResult]) -> [MediaResult] {
        switch contentFilter {
        case .all:
            return items
        case .movies:
            return items.filter { $0.mediaType == .movie }
        case .tvShows:
            return items.filter { $0.mediaType == .tv }
        }
    }
}
