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

    func contains(_ media: MediaResult) -> Bool {
        items.contains {
            $0.mediaId == media.id && $0.mediaType == media.mediaType
        }
    }

    func toggle(_ media: MediaResult, mood: MoodType?) {
        if let existing = items.first(where: { $0.mediaId == media.id && $0.mediaType == media.mediaType }) {
            remove(id: existing.id)
            return
        }

        switch media {
        case .movie(let movie):
            add(item: WatchlistItem.from(movie: movie, mood: mood))
        case .tvShow(let tvShow):
            add(item: WatchlistItem.from(tvShow: tvShow, mood: mood))
        }
    }

    func setWatched(_ isWatched: Bool, for id: UUID) {
        guard let index = items.firstIndex(where: { $0.id == id }) else { return }
        items[index].isWatched = isWatched
        items[index].watchedDate = isWatched ? Date() : nil
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
            // No-op; keep runtime state even if persistence fails.
        }
    }
}
