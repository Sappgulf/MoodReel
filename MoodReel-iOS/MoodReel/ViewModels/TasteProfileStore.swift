import Foundation
import SwiftUI

enum TasteStatus: String, Codable {
    case liked, disliked, neutral
}

@MainActor
final class TasteProfileStore: ObservableObject {
    @Published private(set) var likedIds: Set<String> = []
    @Published private(set) var dislikedIds: Set<String> = []

    private let likedKey = "moodreel-taste-liked-v1"
    private let dislikedKey = "moodreel-taste-disliked-v1"

    init() {
        load()
    }

    func status(for route: MediaRoute) -> TasteStatus {
        let id = route.stableId
        if likedIds.contains(id) { return .liked }
        if dislikedIds.contains(id) { return .disliked }
        return .neutral
    }

    func like(_ route: MediaRoute) {
        let id = route.stableId
        likedIds.insert(id)
        dislikedIds.remove(id)
        save()
    }

    func dislike(_ route: MediaRoute) {
        let id = route.stableId
        dislikedIds.insert(id)
        likedIds.remove(id)
        save()
    }

    func clear(_ route: MediaRoute) {
        let id = route.stableId
        likedIds.remove(id)
        dislikedIds.remove(id)
        save()
    }

    private func load() {
        if let likedData = UserDefaults.standard.data(forKey: likedKey),
           let liked = try? JSONDecoder().decode(Set<String>.self, from: likedData) {
            self.likedIds = liked
        }
        if let dislikedData = UserDefaults.standard.data(forKey: dislikedKey),
           let disliked = try? JSONDecoder().decode(Set<String>.self, from: dislikedData) {
            self.dislikedIds = disliked
        }
    }

    private func save() {
        if let likedData = try? JSONEncoder().encode(likedIds) {
            UserDefaults.standard.set(likedData, forKey: likedKey)
        }
        if let dislikedData = try? JSONEncoder().encode(dislikedIds) {
            UserDefaults.standard.set(dislikedData, forKey: dislikedKey)
        }
    }
}

private extension MediaRoute {
    var stableId: String {
        "\(mediaId)-\(mediaType.rawValue)"
    }
}
