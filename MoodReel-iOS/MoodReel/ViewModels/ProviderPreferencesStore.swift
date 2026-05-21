import Foundation

@MainActor
final class ProviderPreferencesStore: ObservableObject {
    @Published var region: String {
        didSet {
            let normalized = Self.normalizeRegion(region)
            if normalized != region {
                region = normalized
                return
            }
            save()
        }
    }

    @Published var selectedServiceIds: Set<Int> {
        didSet { save() }
    }

    private let regionKey = "moodreel-region"
    private let servicesKey = "moodreel-my-services"

    init() {
        let defaults = UserDefaults.standard
        region = Self.normalizeRegion(defaults.string(forKey: regionKey) ?? "US")

        if let stored = defaults.array(forKey: servicesKey) as? [Int] {
            selectedServiceIds = Set(stored)
        } else {
            selectedServiceIds = []
        }
    }

    func toggleService(_ serviceId: Int) {
        if selectedServiceIds.contains(serviceId) {
            selectedServiceIds.remove(serviceId)
        } else {
            selectedServiceIds.insert(serviceId)
        }
    }

    private func save() {
        let defaults = UserDefaults.standard
        defaults.set(region, forKey: regionKey)
        defaults.set(Array(selectedServiceIds).sorted(), forKey: servicesKey)
    }

    private static func normalizeRegion(_ value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        return trimmed.isEmpty ? "US" : String(trimmed.prefix(2))
    }
}
