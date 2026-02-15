import SwiftUI

struct MainTabView: View {
    @StateObject private var discoverViewModel = DiscoverViewModel()

    var body: some View {
        TabView {
            DiscoverView()
                .environmentObject(discoverViewModel)
                .tabItem {
                    Label("Discover", systemImage: "sparkles.tv")
                }

            WatchlistView()
                .tabItem {
                    Label("Watchlist", systemImage: "bookmark.fill")
                }

            InsightsView()
                .environmentObject(discoverViewModel)
                .tabItem {
                    Label("Insights", systemImage: "chart.bar.fill")
                }

            AchievementsView()
                .environmentObject(discoverViewModel)
                .tabItem {
                    Label("Awards", systemImage: "trophy.fill")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
        .tint(.gold)
    }
}
