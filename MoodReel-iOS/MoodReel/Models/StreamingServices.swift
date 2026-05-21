import Foundation

struct StreamingServiceOption: Identifiable, Hashable {
    let id: Int
    let label: String
}

enum StreamingServiceCatalog {
    static let topOptions: [StreamingServiceOption] = [
        StreamingServiceOption(id: 8, label: "Netflix"),
        StreamingServiceOption(id: 9, label: "Prime"),
        StreamingServiceOption(id: 337, label: "Disney+"),
        StreamingServiceOption(id: 15, label: "Hulu"),
        StreamingServiceOption(id: 1899, label: "Max"),
        StreamingServiceOption(id: 350, label: "Apple TV+"),
        StreamingServiceOption(id: 386, label: "Peacock"),
        StreamingServiceOption(id: 531, label: "Paramount+"),
    ]
}

extension RegionProviders {
    func providerIds() -> Set<Int> {
        var ids = Set<Int>()
        for providers in [flatrate, rent, buy, ads, free].compactMap({ $0 }) {
            for provider in providers {
                ids.insert(provider.providerId)
            }
        }
        return ids
    }

    func matchesAnyService(_ serviceIds: Set<Int>) -> Bool {
        guard !serviceIds.isEmpty else { return true }
        return !providerIds().isDisjoint(with: serviceIds)
    }
}
