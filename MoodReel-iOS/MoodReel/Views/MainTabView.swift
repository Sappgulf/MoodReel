import SwiftUI

struct MainTabView: View {
    @StateObject private var discoverViewModel = DiscoverViewModel()

    var body: some View {
        TabView {
            TonightView()
                .tabItem {
                    Label("Tonight", systemImage: "sparkles.tv")
                }

            DiscoverView()
                .environmentObject(discoverViewModel)
                .tabItem {
                    Label("Discover", systemImage: "film.stack")
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
