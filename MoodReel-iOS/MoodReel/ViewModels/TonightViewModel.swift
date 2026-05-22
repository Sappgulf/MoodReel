import Foundation

@MainActor
final class TonightViewModel: ObservableObject {
    @Published var moodQuery: String = ""
    @Published var availableMinutes: Int = 120
    @Published var servicesOnly: Bool = true
    @Published var adventurous: Bool = false
    @Published var picks: [MediaResult] = []
    @Published var pickReasons: [String] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service: TMDBService
    private var sourceItems: [MediaResult] = []

    init(service: TMDBService = TMDBService()) {
        self.service = service
    }

    func generatePicks(selectedMood: MoodType) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let query = moodQuery.trimmingCharacters(in: .whitespacesAndNewlines)
            sourceItems = try await service.discover(
                mood: selectedMood,
                query: query,
                page: 1
            )
            let genreIds = selectedMood.genreIds
            let ranked = RecommendationScoring.rank(
                items: sourceItems,
                selectedGenreIds: genreIds,
                availableMinutes: availableMinutes,
                adventurous: adventurous
            )
            picks = ranked
            pickReasons = ranked.map {
                RecommendationScoring.explain(
                    item: $0,
                    selectedGenreIds: genreIds,
                    availableMinutes: availableMinutes
                )
            }
        } catch {
            errorMessage = error.localizedDescription
            picks = []
            pickReasons = []
        }
    }
}
