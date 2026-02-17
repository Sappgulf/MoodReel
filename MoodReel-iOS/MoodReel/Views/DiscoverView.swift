import SwiftUI
import UIKit

struct DiscoverView: View {
    @EnvironmentObject private var watchlistStore: WatchlistStore
    @EnvironmentObject private var viewModel: DiscoverViewModel
    @State private var navigationPath: [MediaRoute] = []
    @State private var surpriseMessage: String?
    @State private var feedbackBanner: String?
    @State private var glowPulse = false

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
                    LazyVStack(alignment: .leading, spacing: AppSpacing.md) {
                        header
                        heroCard
                        searchRow

                        if !viewModel.searchHistory.isEmpty {
                            recentSearches
                        }

                        moodScroller
                        controlsRow
                        quickFiltersRow
                        resultsSection
                    }
                    .padding(AppSpacing.md)
                }
                .refreshable {
                    await viewModel.loadForSelectedMood()
                }

                if let feedbackBanner {
                    VStack {
                        Text(feedbackBanner)
                            .font(AppFont.caption())
                            .foregroundStyle(Color.black)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(AppGradients.gold)
                            .clipShape(Capsule())
                            .shadow(color: Color.gold.opacity(0.3), radius: 10, x: 0, y: 4)
                        Spacer()
                    }
                    .padding(.top, 10)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .zIndex(2)
                }
            }
            .navigationBarHidden(true)
            .navigationDestination(for: MediaRoute.self) { route in
                MediaDetailView(route: route)
            }
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

    @State private var heroCardScale: CGFloat = 1.0

    private var heroCard: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            HStack {
                Text("\(viewModel.selectedMood.emoji) \(viewModel.selectedMood.displayName)")
                    .font(AppFont.headline())
                    .foregroundStyle(Color.textPrimary)

                Spacer()

                Text("\(viewModel.filteredItems.count) picks")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.gold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(Color.black.opacity(0.3))
                    )
            }

            Text(viewModel.selectedMood.description)
                .font(AppFont.body())
                .foregroundStyle(Color.textSecondary)

            if let updatedAt = viewModel.lastResultUpdatedAt {
                Text("Updated \(updatedAt.formatted(date: .omitted, time: .shortened))")
                    .font(AppFont.captionSmall())
                    .foregroundStyle(Color.textMuted)
            }
        }
        .padding(AppSpacing.md)
        .background(
            ZStack {
                viewModel.selectedMood.gradient.opacity(0.35)

                // Animated floating orbs
                Circle()
                    .fill(viewModel.selectedMood.color.opacity(0.2))
                    .frame(width: 100, height: 100)
                    .offset(x: 120, y: -20)
                    .blur(radius: 30)

                Circle()
                    .fill(viewModel.selectedMood.secondaryColor.opacity(0.15))
                    .frame(width: 80, height: 80)
                    .offset(x: -100, y: 30)
                    .blur(radius: 25)
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                .stroke(
                    LinearGradient(
                        colors: [Color.white.opacity(0.3), Color.white.opacity(0.1)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .scaleEffect(heroCardScale)
        .onChange(of: viewModel.selectedMood) { _, _ in
            withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                heroCardScale = 0.97
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                    heroCardScale = 1.0
                }
            }
        }
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

    private var recentSearches: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Recent Searches")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textMuted)

                Spacer()

                Button("Clear") {
                    viewModel.clearSearchHistory()
                }
                .font(AppFont.caption())
                .foregroundStyle(Color.textSecondary)
                .buttonStyle(.plain)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(viewModel.searchHistory.prefix(10)) { entry in
                        Button {
                            Task { await viewModel.useSearchHistory(entry) }
                        } label: {
                            Text(entry.query)
                                .font(AppFont.caption())
                                .foregroundStyle(Color.textPrimary)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 7)
                                .background(Color.bgTertiary)
                                .clipShape(Capsule())
                                .overlay(
                                    Capsule()
                                        .stroke(Color.borderDefault, lineWidth: 1)
                                )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var moodScroller: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: AppSpacing.sm) {
                ForEach(MoodType.allCases) { mood in
                    MoodButton(
                        mood: mood,
                        isSelected: mood == viewModel.selectedMood
                    ) {
                        Task { await viewModel.selectMood(mood) }
                    }
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

            surpriseButton
        }
    }

    private var quickFiltersRow: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            HStack {
                Text("Refine Picks")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textMuted)

                Spacer()

                if viewModel.minRating > 0 || viewModel.contentFilter != .all || viewModel.sortOption != .popularity {
                    Button("Reset") {
                        viewModel.minRating = 0
                        viewModel.contentFilter = .all
                        viewModel.sortOption = .popularity
                    }
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textSecondary)
                    .buttonStyle(.plain)
                }
            }

            Picker("Content", selection: $viewModel.contentFilter) {
                ForEach(DiscoverViewModel.ContentFilter.allCases) { filter in
                    Text(filter.title).tag(filter)
                }
            }
            .pickerStyle(.segmented)

            HStack(spacing: AppSpacing.sm) {
                Text("Minimum rating")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textSecondary)

                Spacer()

                Text(viewModel.minRating == 0 ? "Any" : String(format: "%.1f+", viewModel.minRating))
                    .font(AppFont.caption())
                    .foregroundStyle(Color.gold)
                    .accessibilityLabel("Minimum rating \(viewModel.minRating)")
            }

            Slider(value: $viewModel.minRating, in: 0...9, step: 0.5)
                .tint(.gold)

            Picker("Sort", selection: $viewModel.sortOption) {
                ForEach(DiscoverViewModel.SortOption.allCases) { option in
                    Text(option.title).tag(option)
                }
            }
            .pickerStyle(.menu)
            .tint(.textSecondary)
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
    }
    
    @State private var isSurprisePressed = false
    @State private var sparklesRotation: Double = 0

    private var surpriseButton: some View {
        Button {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                isSurprisePressed = true
            }
            
            withAnimation(.linear(duration: 0.6).repeatCount(1)) {
                sparklesRotation += 360
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                withAnimation(.spring(response: 0.3)) {
                    isSurprisePressed = false
                }
            }

            if let pick = viewModel.randomPick() {
                surpriseMessage = "🎬 Try watching: \(pick.displayTitle) (\(pick.mediaType.displayName))"
            } else {
                Task {
                    await viewModel.loadTrending()
                    if let pick = viewModel.randomPick() {
                        surpriseMessage = "🎬 Try watching: \(pick.displayTitle) (\(pick.mediaType.displayName))"
                    } else {
                        surpriseMessage = "No titles available. Pull to refresh!"
                    }
                }
            }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "sparkles")
                    .font(.system(size: 14, weight: .bold))
                    .rotationEffect(.degrees(sparklesRotation))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.goldLight, .amber, .gold],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                Text("Surprise Me")
                    .font(AppFont.caption())
                    .fontWeight(.bold)
            }
            .foregroundStyle(Color.black)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [.gold, .amber, .goldLight],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(
                        Capsule()
                            .stroke(Color.white.opacity(0.3), lineWidth: 1)
                    )
            )
            .scaleEffect(isSurprisePressed ? 0.92 : 1.0)
            .rotationEffect(.degrees(isSurprisePressed ? -2 : 0))
        }
        .buttonStyle(.plain)
        .shadow(color: .gold.opacity(0.5), radius: glowPulse ? 12 : 6, x: 0, y: 3)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                glowPulse = true
            }
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
                            .frame(height: 180)
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

            if !viewModel.isLoading && viewModel.filteredItems.isEmpty {
                VStack(spacing: AppSpacing.md) {
                    Image(systemName: viewModel.items.isEmpty ? "film.slash" : "line.3.horizontal.decrease.circle")
                        .font(.system(size: 48))
                        .foregroundStyle(Color.textMuted)
                    
                    Text(viewModel.items.isEmpty ? "No matches found" : "No picks match your filters")
                        .font(AppFont.headline())
                        .foregroundStyle(Color.textPrimary)
                    
                    Text(viewModel.items.isEmpty ? "Try another mood or broader search." : "Lower the rating bar or switch content type.")
                        .font(AppFont.body())
                        .foregroundStyle(Color.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .padding(AppSpacing.xl)
                .glassCard(cornerRadius: AppRadius.xl, backgroundOpacity: 1)
                .revealOnAppear()
            }

            ForEach(Array(viewModel.filteredItems.enumerated()), id: \.element.stableIdentifier) { index, item in
                MediaCardView(
                    item: item,
                    isSaved: watchlistStore.contains(item),
                    onTap: {
                        navigationPath.append(item.route)
                    }
                ) {
                    let wasSaved = watchlistStore.contains(item)
                    watchlistStore.toggle(item, mood: viewModel.selectedMood)
                    UINotificationFeedbackGenerator().notificationOccurred(wasSaved ? .warning : .success)
                    showFeedback(wasSaved ? "Removed from watchlist" : "Saved to watchlist")
                }
                .onAppear {
                    Task {
                        await viewModel.loadNextPageIfNeeded(currentItem: item)
                    }
                }
                .revealOnAppear(delay: Double(index) * 0.05)
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

    private func showFeedback(_ message: String) {
        withAnimation(AppAnimation.snappy) {
            feedbackBanner = message
        }
        Task {
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            await MainActor.run {
                withAnimation(AppAnimation.snappy) {
                    feedbackBanner = nil
                }
            }
        }
    }
}

// MARK: - Mood Button Component

struct MoodButton: View {
    let mood: MoodType
    let isSelected: Bool
    let action: () -> Void
    
    @State private var isPressed = false
    @State private var emojiBounce = false
    
    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                isPressed = true
            }
            
            withAnimation(.spring(response: 0.4, dampingFraction: 0.5)) {
                emojiBounce = true
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                withAnimation(.spring(response: 0.3)) {
                    isPressed = false
                }
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                withAnimation {
                    emojiBounce = false
                }
            }
            
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            action()
        }) {
            HStack(spacing: 6) {
                Text(mood.emoji)
                    .font(.system(size: isSelected ? 18 : 16))
                    .scaleEffect(emojiBounce ? 1.4 : 1.0)
                    .rotationEffect(.degrees(emojiBounce ? 10 : 0))
                
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
                    .stroke(
                        isSelected 
                            ? Color.clear 
                            : Color.white.opacity(0.1),
                        lineWidth: 1
                    )
            )
            .scaleEffect(isPressed ? 0.9 : 1.0)
        }
        .buttonStyle(.plain)
        .shadow(
            color: isSelected ? mood.color.opacity(0.4) : Color.clear,
            radius: isSelected ? 8 : 0,
            x: 0,
            y: isSelected ? 2 : 0
        )
    }
}
