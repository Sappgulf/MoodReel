import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var watchlistStore: WatchlistStore
    @State private var apiKeyInput = APIKeyStore.shared.apiKey
    @State private var statusMessage: String?

    let onClearAPIKey: () -> Void

    private var trimmedAPIKey: String {
        apiKeyInput.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.bgPrimary.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: AppSpacing.lg) {
                        apiKeyCard
                        quickStatsCard
                        aboutCard
                    }
                    .padding(AppSpacing.md)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var apiKeyCard: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("TMDB API Key")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            TextField("Enter TMDB API key", text: $apiKeyInput)
                .font(AppFont.body())
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .padding(.horizontal, AppSpacing.md)
                .padding(.vertical, 12)
                .background(Color.bgTertiary)
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                        .stroke(Color.borderDefault, lineWidth: 1)
                )

            HStack(spacing: AppSpacing.sm) {
                Button("Save Key") {
                    guard !trimmedAPIKey.isEmpty else {
                        statusMessage = "API key cannot be empty."
                        return
                    }
                    APIKeyStore.shared.apiKey = trimmedAPIKey
                    statusMessage = "API key saved."
                }
                .font(AppFont.caption())
                .foregroundStyle(Color.black)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(AppGradients.gold)
                .clipShape(Capsule())
                .buttonStyle(.plain)

                Button("Clear Key") {
                    APIKeyStore.shared.apiKey = ""
                    apiKeyInput = ""
                    statusMessage = "API key cleared."
                    onClearAPIKey()
                }
                .font(AppFont.caption())
                .foregroundStyle(Color.error)
                .buttonStyle(.plain)
            }

            if let statusMessage {
                Text(statusMessage)
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textSecondary)
            }
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
    }

    private var quickStatsCard: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("Quick Stats")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            Text("Saved titles: \(watchlistStore.items.count)")
                .font(AppFont.body())
                .foregroundStyle(Color.textSecondary)

            Text("Unwatched: \(watchlistStore.unwatchedItems.count)")
                .font(AppFont.body())
                .foregroundStyle(Color.textSecondary)
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
    }

    private var aboutCard: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("About")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            Text("MoodReel for iOS recommends movies and shows based on your mood, with watchlist tracking and quick discovery flows.")
                .font(AppFont.body())
                .foregroundStyle(Color.textSecondary)

            Link("TMDB Terms", destination: URL(string: "https://www.themoviedb.org/terms-of-use")!)
                .font(AppFont.caption())
                .foregroundStyle(Color.gold)
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
    }
}
