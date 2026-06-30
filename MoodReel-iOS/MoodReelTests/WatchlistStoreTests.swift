import Foundation
import Testing
@testable import MoodReel

@MainActor
@Suite("WatchlistStore", .serialized)
struct WatchlistStoreTests {
    private let storageKey = "moodreel-watchlist-v1"

    init() {
        UserDefaults.standard.removeObject(forKey: storageKey)
    }

    private func makeMovie(id: Int, title: String) -> MediaResult {
        .movie(
            Movie(
                id: id,
                title: title,
                originalTitle: title,
                overview: nil,
                posterPath: nil,
                backdropPath: nil,
                voteAverage: 7.5,
                voteCount: 100,
                releaseDate: "2020-01-01",
                genreIds: [28],
                popularity: 50,
                adult: nil,
                originalLanguage: "en",
                video: nil,
                mediaType: .movie
            )
        )
    }

    private func freshStore() -> WatchlistStore {
        WatchlistStore()
    }

    @Test("toggle adds an item to an empty store")
    func toggleAddsItem() {
        let store = freshStore()
        let movie = makeMovie(id: 1, title: "Inception")

        store.toggle(movie, mood: .relaxed)

        #expect(store.items.count == 1)
        #expect(store.contains(movie))
    }

    @Test("toggle removes an item that is already saved")
    func toggleRemovesExistingItem() {
        let store = freshStore()
        let movie = makeMovie(id: 2, title: "Arrival")

        store.toggle(movie, mood: nil)
        #expect(store.contains(movie))

        store.toggle(movie, mood: nil)
        #expect(!store.contains(movie))
        #expect(store.items.isEmpty)
    }

    @Test("contains is false for items that were never added")
    func containsReturnsFalseForUnknownItem() {
        let store = freshStore()
        let movie = makeMovie(id: 999, title: "Unknown")
        #expect(!store.contains(movie))
    }

    @Test("Toggling the same route twice is deduplicated to a single add+remove cycle")
    func duplicateTogglesAreDeduplicated() {
        let store = freshStore()
        let movie = makeMovie(id: 7, title: "Tenet")
        let route = movie.route

        store.toggle(route, mood: .excited)
        #expect(store.contains(route))

        // Toggling via MediaResult and via MediaRoute should refer to the same item
        store.toggle(movie, mood: .excited)
        #expect(!store.contains(route))
        #expect(store.items.isEmpty)
    }

    @Test("setWatched flips the isWatched flag and stores a watched date")
    func setWatchedUpdatesState() {
        let store = freshStore()
        let movie = makeMovie(id: 3, title: "Dune")
        store.toggle(movie, mood: nil)
        guard let id = store.items.first?.id else {
            Issue.record("expected an item to be saved")
            return
        }

        store.setWatched(true, for: id)
        #expect(store.items.first?.isWatched == true)
        #expect(store.items.first?.watchedDate != nil)

        store.setWatched(false, for: id)
        #expect(store.items.first?.isWatched == false)
        #expect(store.items.first?.watchedDate == nil)
    }

    @Test("Persisted items are reloaded on a new store instance")
    func itemsArePersistedAcrossInstances() {
        let first = freshStore()
        let movie = makeMovie(id: 4, title: "Heat")
        first.toggle(movie, mood: .excited)
        #expect(first.items.count == 1)

        let second = freshStore()
        #expect(second.items.count == 1)
        #expect(second.contains(movie))

        // Cleanup so we don't leak state into other suites.
        UserDefaults.standard.removeObject(forKey: storageKey)
    }
}
