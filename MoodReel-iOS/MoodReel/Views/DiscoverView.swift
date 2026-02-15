import SwiftUI

struct DiscoverView: View {
    @EnvironmentObject private var watchlistStore: WatchlistStore
    @StateObject private var viewModel = DiscoverViewModel()
    @State private var surpriseMessage: String?

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color.bgPrimary, Color.bgSecondary],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: AppSpacing.md) {
                        header
                        heroCard
                        searchRow
                        moodScroller
                        controlsRow
                        resultsSection
                    }
                    .padding(AppSpacing.md)
                }
                .refreshable {
                    await viewModel.loadForSelectedMood()
                }
            }
            .navigationBarHidden(true)
        }
        .task {
            if viewModel.items.isEmpty {
                await viewModel.loadForSelectedMood()
            }
        }
        .onChange(of: viewModel.query) { _, _ in
            viewModel.scheduleDebouncedSearch()
        }
        .alert(
            "Tonight's Pick",
            isPresented: Binding(
                get: { surpriseMessage != nil },
                set: { isPresented in
                    if !isPresented { surpriseMessage = nil }
                }
            )
        ) {
            Button("Nice") {
                surpriseMessage = nil
            }
        } message: {
            Text(surpriseMessage ?? "")
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text("MoodReel")
                .font(AppFont.display())
                .goldText()

            Text("Find movies and shows that match your current vibe.")
                .font(AppFont.body())
                .foregroundStyle(Color.textSecondary)
        }
    }

    private var heroCard: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            HStack {
                Text("\(viewModel.selectedMood.emoji) \(viewModel.selectedMood.displayName)")
                    .font(AppFont.headline())
                    .foregroundStyle(Color.textPrimary)

                Spacer()

                Text("\(viewModel.items.count) picks")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.gold)
            }

            Text(viewModel.selectedMood.description)
                .font(AppFont.body())
                .foregroundStyle(Color.textSecondary)
        }
        .padding(AppSpacing.md)
        .background(viewModel.selectedMood.gradient.opacity(0.35))
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                .stroke(Color.borderGold, lineWidth: 1)
        )
    }

    private var searchRow: some View {
        HStack(spacing: AppSpacing.sm) {
            TextField("Search title (optional)", text: $viewModel.query)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .submitLabel(.search)
                .onSubmit {
                    Task { await viewModel.loadForSelectedMood() }
                }
                .padding(.horizontal, AppSpacing.md)
                .padding(.vertical, 12)
                .background(Color.bgTertiary)
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                        .stroke(Color.borderDefault, lineWidth: 1)
                )

            Button("Go") {
                Task { await viewModel.loadForSelectedMood() }
            }
            .font(AppFont.subheadline())
            .foregroundStyle(Color.black)
            .padding(.horizontal, AppSpacing.md)
            .padding(.vertical, 12)
            .background(AppGradients.gold)
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
            .buttonStyle(.plain)
            .pressEffect()
        }
    }

    private var moodScroller: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: AppSpacing.sm) {
                ForEach(MoodType.allCases) { mood in
                    let isSelected = mood == viewModel.selectedMood
                    Button {
                        Task { await viewModel.selectMood(mood) }
                    } label: {
                        HStack(spacing: 6) {
                            Text(mood.emoji)
                            Text(mood.displayName)
                                .font(AppFont.caption())
                        }
                        .foregroundStyle(isSelected ? Color.black : Color.textPrimary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(
                            Group {
                                if isSelected {
                                    mood.gradient
                                } else {
                                    Color.bgTertiary
                                }
                            }
                        )
                        .clipShape(Capsule())
                        .overlay(
                            Capsule()
                                .stroke(isSelected ? Color.clear : Color.borderDefault, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var controlsRow: some View {
        HStack(spacing: AppSpacing.sm) {
            Button {
                Task { await viewModel.loadTrending() }
            } label: {
                Label("Trending", systemImage: "flame.fill")
                    .font(AppFont.caption())
            }
            .foregroundStyle(Color.gold)
            .buttonStyle(.plain)

            Button {
                Task { await viewModel.loadForSelectedMood() }
            } label: {
                Label("Refresh", systemImage: "arrow.clockwise")
                    .font(AppFont.caption())
            }
            .foregroundStyle(Color.textSecondary)
            .buttonStyle(.plain)

            Spacer()

            Button {
                if let pick = viewModel.randomPick() {
                    surpriseMessage = "Try \(pick.displayTitle) (\(pick.mediaType.displayName))."
                } else {
                    Task {
                        await viewModel.loadTrending()
                        if let pick = viewModel.randomPick() {
                            surpriseMessage = "Try \(pick.displayTitle) (\(pick.mediaType.displayName))."
                        } else {
                            surpriseMessage = "No titles available right now. Pull to refresh and try again."
                        }
                    }
                }
            } label: {
                Label("Surprise Me", systemImage: "sparkles")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.black)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(AppGradients.gold)
                    .clipShape(Capsule())
            }
            .buttonStyle(.plain)
        }
    }

    private var resultsSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            if viewModel.isLoading && viewModel.items.isEmpty {
                VStack(spacing: AppSpacing.sm) {
                    HStack {
                        ProgressView()
                            .tint(.gold)
                        Text("Loading recommendations...")
                            .font(AppFont.caption())
                            .foregroundStyle(Color.textSecondary)
                    }
                    ForEach(0..<3, id: \.self) { _ in
                        RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                            .fill(Color.bgTertiary)
                            .frame(height: 160)
                            .shimmerEffect()
                    }
                }
                .padding(.vertical, AppSpacing.md)
            }

            if let errorMessage = viewModel.errorMessage, !errorMessage.isEmpty {
                Text(errorMessage)
                    .font(AppFont.caption())
                    .foregroundStyle(Color.error)
                    .padding(.vertical, AppSpacing.sm)
            }

            if !viewModel.isLoading && viewModel.items.isEmpty {
                Text("No matches found. Try another mood or broader search.")
                    .font(AppFont.body())
                    .foregroundStyle(Color.textSecondary)
                    .padding(.vertical, AppSpacing.md)
            }

            ForEach(viewModel.items, id: \.stableIdentifier) { item in
                MediaCardView(
                    item: item,
                    isSaved: watchlistStore.contains(item)
                ) {
                    watchlistStore.toggle(item, mood: viewModel.selectedMood)
                }
                .onAppear {
                    Task {
                        await viewModel.loadNextPageIfNeeded(currentItem: item)
                    }
                }
            }

            if viewModel.isLoadingMore {
                HStack {
                    Spacer()
                    ProgressView()
                        .tint(.gold)
                    Text("Loading more")
                        .font(AppFont.caption())
                        .foregroundStyle(Color.textSecondary)
                    Spacer()
                }
            }
        }
    }
}
