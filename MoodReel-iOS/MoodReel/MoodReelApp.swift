import SwiftUI
import UIKit

@main
struct MoodReelApp: App {
    @StateObject private var watchlistStore = WatchlistStore()
    @StateObject private var tasteProfileStore = TasteProfileStore()
    @StateObject private var providerPreferencesStore = ProviderPreferencesStore()

    init() {
        configureAppearance()
        configureNetworkingCache()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(watchlistStore)
                .environmentObject(tasteProfileStore)
                .environmentObject(providerPreferencesStore)
        }
    }

    private func configureAppearance() {
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = UIColor(Color.bgPrimary)
        navAppearance.titleTextAttributes = [.foregroundColor: UIColor(Color.textPrimary)]
        navAppearance.largeTitleTextAttributes = [.foregroundColor: UIColor(Color.textPrimary)]
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance

        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = UIColor(Color.bgSecondary)
        tabAppearance.stackedLayoutAppearance.selected.iconColor = UIColor(Color.gold)
        tabAppearance.stackedLayoutAppearance.selected.titleTextAttributes = [.foregroundColor: UIColor(Color.gold)]
        tabAppearance.stackedLayoutAppearance.normal.iconColor = UIColor(Color.textMuted)
        tabAppearance.stackedLayoutAppearance.normal.titleTextAttributes = [.foregroundColor: UIColor(Color.textMuted)]
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
    }

    private func configureNetworkingCache() {
        let cacheURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?
            .appendingPathComponent("moodreel-url-cache", isDirectory: true)
        // TMDB images are immutable (paths include content hashes), so we can cache aggressively.
        URLCache.shared = URLCache(
            memoryCapacity: 128 * 1024 * 1024,   // 128 MB in-memory
            diskCapacity: 512 * 1024 * 1024,     // 512 MB on-disk for posters/backdrops
            directory: cacheURL
        )
    }
}
