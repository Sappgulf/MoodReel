import SwiftUI

struct TonightView: View {
    @EnvironmentObject private var discoverViewModel: DiscoverViewModel
    @EnvironmentObject private var watchlistStore: WatchlistStore
    @StateObject private var viewModel = TonightViewModel()
    @State private var navigationPath: [MediaRoute] = []

    private let pickLabels = ["Safe Bet", "Best Match", "Wild Card"]

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
                        Text("Tonight Mode")
                            .font(AppFont.title())
                            .foregroundStyle(Color.textPrimary)

                        Text("Three curated picks for your mood and time.")
                            .font(AppFont.body())
                            .foregroundStyle(Color.textSecondary)

                        TextField("Mood or vibe", text: $viewModel.moodQuery)
                            .textFieldStyle(.roundedBorder)

                        Stepper("Time: \(viewModel.availableMinutes) min", value: $viewModel.availableMinutes, in: 45...240, step: 15)

                        Toggle("Adventurous picks", isOn: $viewModel.adventurous)

                        Button {
                            Task { await viewModel.generatePicks(selectedMood: discoverViewModel.selectedMood) }
                        } label: {
                            Text("Get tonight picks")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.gold)

                        if viewModel.isLoading {
                            ProgressView("Finding picks…")
                        }

                        if let error = viewModel.errorMessage {
                            Text(error)
                                .font(AppFont.caption())
                                .foregroundStyle(Color.crimson)
                        }

                        ForEach(Array(viewModel.picks.enumerated()), id: \.element.stableIdentifier) { index, item in
                            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                                Text(pickLabels[safe: index] ?? "Pick")
                                    .font(AppFont.headline())
                                    .foregroundStyle(Color.gold)

                                if index < viewModel.pickReasons.count {
                                    Text(viewModel.pickReasons[index])
                                        .font(AppFont.caption())
                                        .foregroundStyle(Color.textSecondary)
                                }

                                MediaCardView(
                                    item: item,
                                    isSaved: watchlistStore.contains(item),
                                    onTap: { navigationPath.append(item.route) },
                                    onToggleSave: { watchlistStore.toggle(item) }
                                )
                            }
                        }
                    }
                    .padding(AppSpacing.md)
                }
            }
            .navigationDestination(for: MediaRoute.self) { route in
                MediaDetailView(route: route)
            }
        }
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
