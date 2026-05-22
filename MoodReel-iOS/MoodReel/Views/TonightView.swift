import SwiftUI

struct TonightView: View {
    @EnvironmentObject private var watchlistStore: WatchlistStore
    @StateObject private var viewModel = TonightViewModel()
    @State private var navigationPath: [MediaRoute] = []

    var body: some View {
        NavigationStack(path: $navigationPath) {
            ZStack {
                LinearGradient(
                    colors: [Color.bgPrimary, Color.bgSecondary],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                        header
                        controls
                        statusSection
                        picksSection
                    }
                    .padding(AppSpacing.md)
                }
            }
            .navigationBarHidden(true)
            .navigationDestination(for: MediaRoute.self) { route in
                MediaDetailView(route: route)
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("Tonight Mode")
                .font(AppFont.title())
                .foregroundStyle(Color.textPrimary)

            Text("Three curated picks based on your mood and how much time you have.")
                .font(AppFont.body())
                .foregroundStyle(Color.textSecondary)
        }
    }

    private var controls: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Text("Mood")
                .font(AppFont.caption())
                .foregroundStyle(Color.textMuted)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.sm) {
                    ForEach(MoodType.allCases) { mood in
                        Button {
                            viewModel.selectedMood = mood
                        } label: {
                            VStack(spacing: 4) {
                                Text(mood.emoji)
                                    .font(.title2)
                                Text(mood.displayName)
                                    .font(AppFont.caption())
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .background(
                                viewModel.selectedMood == mood
                                    ? mood.gradient
                                    : LinearGradient(
                                        colors: [Color.bgSecondary, Color.bgSecondary],
                                        startPoint: .top,
                                        endPoint: .bottom
                                    )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(mood.displayName) mood")
                    }
                }
            }

            Stepper(
                "Available time: \(viewModel.availableMinutes) min",
                value: $viewModel.availableMinutes,
                in: 45...240,
                step: 15
            )
            .font(AppFont.body())
            .foregroundStyle(Color.textPrimary)

            Picker("Content type", selection: $viewModel.contentFilter) {
                ForEach(TonightViewModel.ContentFilter.allCases) { filter in
                    Text(filter.title).tag(filter)
                }
            }
            .pickerStyle(.segmented)

            Picker("Pick style", selection: $viewModel.pickMode) {
                ForEach(TonightPickMode.allCases) { mode in
                    Text(mode.title).tag(mode)
                }
            }
            .pickerStyle(.segmented)

            Button {
                Task { await viewModel.loadTonightPicks() }
            } label: {
                Label("Get tonight picks", systemImage: "moon.stars.fill")
                    .font(AppFont.headline())
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.gold)
            .disabled(viewModel.isLoading)
            .accessibilityIdentifier("get-tonight-picks")
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
    }

    @ViewBuilder
    private var statusSection: some View {
        if viewModel.isLoading {
            ProgressView("Finding picks for tonight…")
                .font(AppFont.body())
                .foregroundStyle(Color.textSecondary)
        } else if let errorMessage = viewModel.errorMessage {
            Text(errorMessage)
                .font(AppFont.body())
                .foregroundStyle(Color.error)
        } else if viewModel.picks.isEmpty {
            Text("Choose a mood and tap Get tonight picks.")
                .font(AppFont.body())
                .foregroundStyle(Color.textSecondary)
        }
    }

    @ViewBuilder
    private var picksSection: some View {
        ForEach(viewModel.picks) { pick in
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                Text(pick.label.rawValue)
                    .font(AppFont.headline())
                    .foregroundStyle(Color.gold)

                Text("Why this pick? \(pick.reason)")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textSecondary)

                MediaCardView(
                    item: pick.item,
                    isSaved: watchlistStore.contains(pick.item),
                    onTap: { navigationPath.append(pick.item.route) },
                    onToggleSave: { watchlistStore.toggle(pick.item, mood: viewModel.selectedMood) }
                )
            }
            .padding(AppSpacing.md)
            .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
        }
    }
}
