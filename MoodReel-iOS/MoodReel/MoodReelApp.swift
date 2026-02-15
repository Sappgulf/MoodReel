import SwiftUI
import UIKit

@main
struct MoodReelApp: App {
    @StateObject private var watchlistStore = WatchlistStore()

    init() {
        configureAppearance()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(watchlistStore)
                .preferredColorScheme(.dark)
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
}
