import Foundation

@MainActor
final class WatchlistStore: ObservableObject {
    @Published private(set) var items: [WatchlistItem] = []

    private let storageKey = "moodreel-watchlist-v1"

    init() {
        load()
    }

    var sortedItems: [WatchlistItem] {
        items.sorted { $0.dateAdded > $1.dateAdded }
    }

    var unwatchedItems: [WatchlistItem] {
        items.filter { !$0.isWatched }
    }

    var watchedItems: [WatchlistItem] {
        items.filter { $0.isWatched }
    }

    func contains(_ media: MediaResult) -> Bool {
        contains(media.route)
    }

    func contains(_ route: MediaRoute) -> Bool {
        items.contains {
            $0.mediaId == route.mediaId && $0.mediaType == route.mediaType
        }
    }

    func item(for route: MediaRoute) -> WatchlistItem? {
        items.first {
            $0.mediaId == route.mediaId && $0.mediaType == route.mediaType
        }
    }

    func toggle(_ media: MediaResult, mood: MoodType?) {
        toggle(media.route, mood: mood)
    }

    func toggle(_ route: MediaRoute, mood: MoodType? = nil) {
        if let existing = item(for: route) {
            remove(id: existing.id)
            return
        }
        add(item: itemFromRoute(route, mood: mood))
    }

    func ensureSaved(_ route: MediaRoute, mood: MoodType? = nil) -> UUID {
        if let existing = item(for: route) {
            return existing.id
        }
        let item = itemFromRoute(route, mood: mood)
        add(item: item)
        return item.id
    }

    func setWatched(_ isWatched: Bool, for id: UUID) {
        guard let index = items.firstIndex(where: { $0.id == id }) else { return }
        items[index].isWatched = isWatched
        items[index].watchedDate = isWatched ? Date() : nil
        save()
    }

    func setFavorite(_ isFavorite: Bool, for id: UUID) {
        guard let index = items.firstIndex(where: { $0.id == id }) else { return }
        items[index].isFavorite = isFavorite
        save()
    }

    func setRating(_ rating: Double?, for id: UUID) {
        guard let index = items.firstIndex(where: { $0.id == id }) else { return }
        items[index].userRating = rating
        save()
    }

    func setNotes(_ notes: String?, for id: UUID) {
        guard let index = items.firstIndex(where: { $0.id == id }) else { return }
        let trimmed = notes?.trimmingCharacters(in: .whitespacesAndNewlines)
        items[index].userNotes = (trimmed?.isEmpty ?? true) ? nil : trimmed
        save()
    }

    func remove(id: UUID) {
        items.removeAll { $0.id == id }
        save()
    }

    func randomUnwatched() -> WatchlistItem? {
        unwatchedItems.randomElement()
    }

    private func add(item: WatchlistItem) {
        items.append(item)
        save()
    }

    private func itemFromRoute(_ route: MediaRoute, mood: MoodType?) -> WatchlistItem {
        WatchlistItem(
            mediaId: route.mediaId,
            mediaType: route.mediaType,
            title: route.title,
            posterPath: route.posterPath,
            backdropPath: route.backdropPath,
            voteAverage: route.voteAverage,
            releaseYear: route.releaseYear,
            overview: route.overview,
            moodWhenAdded: mood
        )
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: storageKey) else { return }
        do {
            items = try JSONDecoder().decode([WatchlistItem].self, from: data)
        } catch {
            items = []
        }
    }

    private func save() {
        do {
            let data = try JSONEncoder().encode(items)
            UserDefaults.standard.set(data, forKey: storageKey)
        } catch {
            // Keep runtime state even if persistence fails.
        }
    }
}
