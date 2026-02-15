import SwiftUI

struct MainTabView: View {
    let onClearAPIKey: () -> Void

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

            SettingsView(onClearAPIKey: onClearAPIKey)
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
        .tint(.gold)
    }
}
