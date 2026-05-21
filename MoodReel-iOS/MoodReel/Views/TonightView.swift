import SwiftUI

struct TonightView: View {
    @EnvironmentObject private var watchlistStore: WatchlistStore
    @EnvironmentObject private var tasteProfileStore: TasteProfileStore
    @EnvironmentObject private var providerPreferences: ProviderPreferencesStore
    @StateObject private var viewModel: TonightViewModel
    @State private var navigationPath: [MediaRoute] = []

    @MainActor
    init() {
        _viewModel = StateObject(wrappedValue: TonightViewModel())
    }

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
                        hero
                        decisionPanel
                        resultSection
                    }
                    .padding(AppSpacing.md)
                }
                .refreshable {
                    await findPicks()
                }
            }
            .navigationBarHidden(true)
            .navigationDestination(for: MediaRoute.self) { route in
                MediaDetailView(route: route)
            }
        }
        .task {
            if viewModel.picks.isEmpty {
                await findPicks()
            }
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text("Tonight Mode")
                    .font(AppFont.captionSmall())
                    .foregroundStyle(Color.gold)
                    .textCase(.uppercase)

                Text("Find what to watch tonight.")
                    .font(AppFont.displayLarge(34))
                    .foregroundStyle(Color.textPrimary)
                    .fixedSize(horizontal: false, vertical: true)

                Text("Tell MoodReel the vibe, time, format, and watching context. It returns a Safe Bet, Best Match, and Wild Card.")
                    .font(AppFont.body())
                    .foregroundStyle(Color.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            HStack(spacing: AppSpacing.sm) {
                metric(value: "\(viewModel.picks.count == 0 ? 3 : viewModel.picks.count)", label: "picks")
                metric(value: "\(viewModel.candidateCount)", label: "ranked")
                metric(value: viewModel.vibeOrMoodLabel, label: "vibe")
            }
        }
        .padding(AppSpacing.lg)
        .background(
            ZStack(alignment: .topTrailing) {
                AppGradients.radialGold
                Color.bgGlass
                Circle()
                    .fill(Color.gold.opacity(0.12))
                    .frame(width: 140, height: 140)
                    .blur(radius: 32)
                    .offset(x: 46, y: -40)
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous))
        .goldBorder(cornerRadius: AppRadius.xl, opacity: 0.38)
    }

    private func metric(value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value)
                .font(AppFont.subheadline())
                .foregroundStyle(Color.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            Text(label)
                .font(AppFont.captionSmall())
                .foregroundStyle(Color.textMuted)
                .textCase(.uppercase)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppSpacing.sm)
        .background(Color.black.opacity(0.25))
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
    }

    private var decisionPanel: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            TextField("Vibe, mood, or situation", text: $viewModel.vibe)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .submitLabel(.search)
                .onSubmit {
                    Task { await findPicks() }
                }
                .padding(.horizontal, AppSpacing.md)
                .padding(.vertical, 13)
                .background(Color.bgTertiary)
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                        .stroke(Color.borderDefault, lineWidth: 1)
                )
                .accessibilityLabel("Tonight vibe")

            moodSelector
            runtimeSelector

            Picker("Content", selection: $viewModel.contentKind) {
                ForEach(TonightViewModel.ContentKind.allCases) { kind in
                    Text(kind.title).tag(kind)
                }
            }
            .pickerStyle(.segmented)

            Picker("Watching context", selection: $viewModel.watchingContext) {
                ForEach(TonightViewModel.WatchingContext.allCases) { context in
                    Text(context.title).tag(context)
                }
            }
            .pickerStyle(.segmented)

            Picker("Preference", selection: $viewModel.riskPreference) {
                ForEach(TonightViewModel.RiskPreference.allCases) { preference in
                    Text(preference.title).tag(preference)
                }
            }
            .pickerStyle(.segmented)

            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                HStack {
                    Text("Minimum rating")
                        .font(AppFont.caption())
                        .foregroundStyle(Color.textSecondary)
                    Spacer()
                    Text(String(format: "%.1f+", viewModel.minimumRating))
                        .font(AppFont.caption())
                        .foregroundStyle(Color.gold)
                }
                Slider(value: $viewModel.minimumRating, in: 0...9, step: 0.5)
                    .tint(.gold)
            }

            HStack(spacing: AppSpacing.md) {
                Toggle("Hide disliked", isOn: $viewModel.hideDisliked)
                Toggle("Hide watched", isOn: $viewModel.hideWatched)
            }
            .font(AppFont.caption())
            .foregroundStyle(Color.textSecondary)
            .toggleStyle(.switch)

            providerSetup

            HStack(spacing: AppSpacing.sm) {
                Button {
                    Task { await findPicks() }
                } label: {
                    Label(viewModel.isLoading ? "Finding..." : "Find Tonight's Picks", systemImage: "sparkles")
                        .font(AppFont.subheadline())
                        .foregroundStyle(Color.black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(AppGradients.gold)
                        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(viewModel.isLoading)
                .pressEffect()

                Button("Reset") {
                    viewModel.resetFilters()
                }
                .font(AppFont.caption())
                .foregroundStyle(Color.textSecondary)
                .padding(.horizontal, 12)
                .padding(.vertical, 13)
                .background(Color.bgTertiary)
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                .buttonStyle(.plain)
            }
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.xl, backgroundOpacity: 1)
    }

    private var moodSelector: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text("Vibe lane")
                .font(AppFont.caption())
                .foregroundStyle(Color.textMuted)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.sm) {
                    ForEach(MoodType.allCases) { mood in
                        let isSelected = mood == viewModel.selectedMood
                        Button {
                            viewModel.selectedMood = mood
                        } label: {
                            Text("\(mood.emoji) \(mood.displayName)")
                                .font(AppFont.caption())
                                .foregroundStyle(isSelected ? Color.black : Color.textPrimary)
                                .padding(.horizontal, 11)
                                .padding(.vertical, 8)
                                .background(isSelected ? AnyShapeStyle(AppGradients.gold) : AnyShapeStyle(Color.bgTertiary))
                                .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(mood.displayName)
                    }
                }
            }
        }
    }

    private var providerSetup: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("Streaming setup")
                .font(AppFont.caption())
                .foregroundStyle(Color.textMuted)

            HStack(spacing: AppSpacing.sm) {
                Text("Region")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textSecondary)
                TextField("US", text: $providerPreferences.region)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(Color.bgTertiary)
                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                    .frame(maxWidth: 88)
            }

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: 8)], spacing: 8) {
                ForEach(StreamingServiceCatalog.topOptions) { service in
                    let isSelected = providerPreferences.selectedServiceIds.contains(service.id)
                    Button {
                        providerPreferences.toggleService(service.id)
                    } label: {
                        Text(service.label)
                            .font(AppFont.caption())
                            .foregroundStyle(isSelected ? Color.black : Color.textPrimary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 9)
                            .background(isSelected ? AnyShapeStyle(AppGradients.gold) : AnyShapeStyle(Color.bgTertiary))
                            .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(service.label)
                    .accessibilityAddTraits(isSelected ? .isSelected : [])
                }
            }

            Toggle("Services-only", isOn: $viewModel.servicesOnly)
                .font(AppFont.caption())
                .foregroundStyle(Color.textSecondary)
                .toggleStyle(.switch)
        }
    }

    private var runtimeSelector: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text("Available time")
                .font(AppFont.caption())
                .foregroundStyle(Color.textMuted)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 128), spacing: 8)], spacing: 8) {
                ForEach(TonightViewModel.RuntimeOption.allCases) { option in
                    let isSelected = option == viewModel.runtimeOption
                    Button {
                        viewModel.runtimeOption = option
                    } label: {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(option.title)
                                .font(AppFont.caption())
                                .foregroundStyle(isSelected ? Color.black : Color.textPrimary)
                            Text(option.subtitle)
                                .font(AppFont.captionSmall())
                                .foregroundStyle(isSelected ? Color.black.opacity(0.7) : Color.textMuted)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(isSelected ? AnyShapeStyle(AppGradients.gold) : AnyShapeStyle(Color.bgTertiary))
                        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    @ViewBuilder
    private var resultSection: some View {
        if viewModel.isLoading {
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                ForEach(0..<3, id: \.self) { _ in
                    RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                        .fill(Color.bgTertiary)
                        .frame(height: 170)
                        .shimmerEffect()
                }
            }
            .accessibilityLabel("Loading Tonight picks")
        } else if let errorMessage = viewModel.errorMessage, viewModel.picks.isEmpty {
            emptyState(title: "Tonight Mode needs a wider lane.", message: errorMessage)
        } else if viewModel.picks.isEmpty {
            emptyState(
                title: "Ready when the couch is.",
                message: "Tune the vibe and ask MoodReel for three explained picks."
            )
        } else {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Your three picks")
                            .font(AppFont.headline())
                            .foregroundStyle(Color.textPrimary)
                        if let updatedAt = viewModel.lastUpdatedAt {
                            Text("Updated \(updatedAt.formatted(date: .omitted, time: .shortened))")
                                .font(AppFont.captionSmall())
                                .foregroundStyle(Color.textMuted)
                        }
                    }

                    Spacer()

                    ShareLink(item: viewModel.shareText) {
                        Label("Share", systemImage: "square.and.arrow.up")
                            .font(AppFont.caption())
                    }
                    .foregroundStyle(Color.gold)
                }

                ForEach(viewModel.picks) { pick in
                    TonightPickCard(
                        pick: pick,
                        isSaved: watchlistStore.contains(pick.item),
                        onOpen: { navigationPath.append(pick.item.route) },
                        onToggleSave: { watchlistStore.toggle(pick.item, mood: viewModel.selectedMood) }
                    )
                }
            }
        }
    }

    private func emptyState(title: String, message: String) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text(title)
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)
            Text(message)
                .font(AppFont.body())
                .foregroundStyle(Color.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppSpacing.lg)
        .glassCard(cornerRadius: AppRadius.xl, backgroundOpacity: 1)
    }

    private func findPicks() async {
        await viewModel.findPicks(
            watchlist: watchlistStore.items,
            likedIds: tasteProfileStore.likedIds,
            dislikedIds: tasteProfileStore.dislikedIds,
            region: providerPreferences.region,
            selectedServiceIds: providerPreferences.selectedServiceIds
        )
    }
}

private struct TonightPickCard: View {
    let pick: TonightViewModel.TonightPick
    let isSaved: Bool
    let onOpen: () -> Void
    let onToggleSave: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            backdrop

            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(pick.slotTitle)
                            .font(AppFont.captionSmall())
                            .foregroundStyle(slotColor)
                            .textCase(.uppercase)
                        Text(pick.item.displayTitle)
                            .font(AppFont.headline())
                            .foregroundStyle(Color.textPrimary)
                            .lineLimit(2)
                    }

                    Spacer()

                    Text("\(pick.confidence)%")
                        .font(AppFont.caption())
                        .foregroundStyle(Color.black)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 5)
                        .background(AppGradients.gold)
                        .clipShape(Capsule())
                }

                HStack(spacing: AppSpacing.sm) {
                    pill(pick.item.mediaType.displayName)
                    if let year = pick.item.releaseYear {
                        pill(year)
                    }
                    pill("★ \(pick.item.ratingFormatted)")
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Why this pick?")
                        .font(AppFont.captionSmall())
                        .foregroundStyle(Color.gold)
                    Text(pick.reason)
                        .font(AppFont.caption())
                        .foregroundStyle(Color.textSecondary)
                    if let caveat = pick.caveat {
                        Text("Caveat: \(caveat)")
                            .font(AppFont.captionSmall())
                            .foregroundStyle(Color.textMuted)
                    }
                }

                HStack(spacing: AppSpacing.sm) {
                    Button(action: onToggleSave) {
                        Label(isSaved ? "Saved" : "Save", systemImage: isSaved ? "checkmark.circle.fill" : "plus.circle")
                            .font(AppFont.caption())
                            .foregroundStyle(isSaved ? Color.success : Color.black)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 9)
                            .background(isSaved ? AnyShapeStyle(Color.success.opacity(0.14)) : AnyShapeStyle(AppGradients.gold))
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)

                    Button(action: onOpen) {
                        Label("Details", systemImage: "chevron.right")
                            .font(AppFont.caption())
                            .foregroundStyle(Color.textPrimary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 9)
                            .background(Color.bgTertiary)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, AppSpacing.md)
            .padding(.bottom, AppSpacing.md)
        }
        .background(Color.bgGlass)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous))
        .goldBorder(cornerRadius: AppRadius.xl, opacity: pick.slot == .best ? 0.48 : 0.28)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(pick.slotTitle), \(pick.item.displayTitle), \(pick.confidence) percent match")
    }

    private var backdrop: some View {
        AsyncImage(url: pick.item.backdropURL ?? pick.item.posterURL) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .scaledToFill()
            case .failure:
                placeholder
            case .empty:
                placeholder.shimmerEffect()
            @unknown default:
                placeholder
            }
        }
        .frame(height: 150)
        .overlay(AppGradients.cardOverlay)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous))
    }

    private var placeholder: some View {
        Rectangle()
            .fill(Color.bgTertiary)
            .overlay(
                Image(systemName: "film.stack")
                    .font(.system(size: 28, weight: .medium))
                    .foregroundStyle(Color.textMuted)
            )
    }

    private var slotColor: Color {
        switch pick.slot {
        case .safe: return .success
        case .best: return .gold
        case .wild: return .amber
        }
    }

    private func pill(_ text: String) -> some View {
        Text(text)
            .font(AppFont.captionSmall())
            .foregroundStyle(Color.textMuted)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color.bgTertiary)
            .clipShape(Capsule())
    }
}

#Preview {
    TonightView()
        .environmentObject(WatchlistStore())
        .environmentObject(TasteProfileStore())
        .environmentObject(ProviderPreferencesStore())
}
