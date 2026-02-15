import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            DiscoverView()
                .tabItem {
                    Label("Discover", systemImage: "sparkles.tv")
                }

            WatchlistView()
                .tabItem {
                    Label("Watchlist", systemImage: "bookmark.fill")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
        .tint(.gold)
    }
}
