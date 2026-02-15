import SwiftUI

struct MediaDetailView: View {
    @EnvironmentObject private var watchlistStore: WatchlistStore
    @StateObject private var viewModel: MediaDetailViewModel
    @State private var userRating: Double = 7.0
    @State private var hasRating = false
    @State private var notesDraft = ""

    init(route: MediaRoute) {
        _viewModel = StateObject(wrappedValue: MediaDetailViewModel(route: route))
    }

    private var route: MediaRoute { viewModel.route }

    private var savedItem: WatchlistItem? {
        watchlistStore.item(for: route)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                headerPoster
                titleBlock
                actionsBlock
                overviewBlock
                providersBlock
                castBlock
                trailerBlock
                personalNotesBlock
                similarBlock
            }
            .padding(.bottom, AppSpacing.xl)
        }
        .background(Color.bgPrimary.ignoresSafeArea())
        .navigationTitle(viewModel.displayTitle)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if viewModel.bundle == nil {
                await viewModel.load()
            }
            syncEditorState()
        }
        .onChange(of: watchlistStore.items.count) { _, _ in
            syncEditorState()
        }
        .navigationDestination(for: MediaRoute.self) { nextRoute in
            MediaDetailView(route: nextRoute)
        }
    }

    private var headerPoster: some View {
        ZStack(alignment: .bottomLeading) {
            AsyncImage(url: viewModel.backdropURL) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFill()
                default:
                    Rectangle()
                        .fill(Color.bgTertiary)
                }
            }
            .frame(height: 220)
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
            .overlay(
                LinearGradient(
                    colors: [Color.clear, Color.bgPrimary.opacity(0.9)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
            )

            if let runtime = viewModel.runtimeText {
                Text(runtime)
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textPrimary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.black.opacity(0.6))
                    .clipShape(Capsule())
                    .padding()
            }
        }
        .padding(.horizontal, AppSpacing.md)
        .padding(.top, AppSpacing.sm)
    }

    private var titleBlock: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text(viewModel.displayTitle)
                .font(AppFont.display())
                .foregroundStyle(Color.textPrimary)

            HStack(spacing: AppSpacing.sm) {
                pill("★ \(viewModel.ratingText)", color: .gold)
                pill(route.mediaType.displayName, color: .amber)
                if let year = viewModel.releaseYear {
                    pill(year, color: .textMuted)
                }
            }

            if let genres = viewModel.genresText {
                Text(genres)
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textSecondary)
            }
        }
        .padding(.horizontal, AppSpacing.md)
    }

    private var actionsBlock: some View {
        HStack(spacing: AppSpacing.sm) {
            Button {
                watchlistStore.toggle(route)
            } label: {
                Label(
                    savedItem == nil ? "Save to Watchlist" : "Remove from Watchlist",
                    systemImage: savedItem == nil ? "bookmark.badge.plus" : "bookmark.slash"
                )
                .font(AppFont.caption())
                .foregroundStyle(savedItem == nil ? Color.black : Color.error)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(savedItem == nil ? AnyShapeStyle(AppGradients.gold) : AnyShapeStyle(Color.error.opacity(0.12)))
                .clipShape(Capsule())
            }
            .buttonStyle(.plain)

            if let item = savedItem {
                Button {
                    watchlistStore.setWatched(!item.isWatched, for: item.id)
                } label: {
                    Label(item.isWatched ? "Watched" : "Mark Watched", systemImage: item.isWatched ? "checkmark.circle.fill" : "clock")
                        .font(AppFont.caption())
                        .foregroundStyle(item.isWatched ? Color.success : Color.gold)
                }
                .buttonStyle(.plain)

                Button {
                    watchlistStore.setFavorite(!item.isFavorite, for: item.id)
                } label: {
                    Image(systemName: item.isFavorite ? "heart.fill" : "heart")
                        .foregroundStyle(item.isFavorite ? Color.crimson : Color.textSecondary)
                        .padding(8)
                        .background(Color.bgTertiary)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }

            Spacer()
        }
        .padding(.horizontal, AppSpacing.md)
    }

    private var overviewBlock: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("Overview")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            if viewModel.isLoading && viewModel.bundle == nil {
                RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                    .fill(Color.bgTertiary)
                    .frame(height: 90)
                    .shimmerEffect()
            } else {
                Text(viewModel.overview)
                    .font(AppFont.body())
                    .foregroundStyle(Color.textSecondary)
            }

            if let error = viewModel.errorMessage {
                Text(error)
                    .font(AppFont.caption())
                    .foregroundStyle(Color.error)
            }
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
        .padding(.horizontal, AppSpacing.md)
    }

    private var providersBlock: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("Where to Watch")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            if let providers = viewModel.bundle?.watchProviders {
                providerRow(title: "Stream", providers: providers.flatrate)
                providerRow(title: "Rent", providers: providers.rent)
                providerRow(title: "Buy", providers: providers.buy)
            } else {
                Text("Provider data not available for your region.")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textMuted)
            }
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
        .padding(.horizontal, AppSpacing.md)
    }

    private var castBlock: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("Top Cast")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            if let cast = viewModel.bundle?.credits?.cast, !cast.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: AppSpacing.sm) {
                        ForEach(cast.prefix(12)) { actor in
                            VStack(alignment: .leading, spacing: 4) {
                                AsyncImage(url: actor.profileURL) { phase in
                                    switch phase {
                                    case .success(let image):
                                        image.resizable().scaledToFill()
                                    default:
                                        RoundedRectangle(cornerRadius: AppRadius.sm, style: .continuous)
                                            .fill(Color.bgTertiary)
                                    }
                                }
                                .frame(width: 92, height: 110)
                                .clipShape(RoundedRectangle(cornerRadius: AppRadius.sm, style: .continuous))

                                Text(actor.name)
                                    .font(AppFont.caption())
                                    .foregroundStyle(Color.textPrimary)
                                    .lineLimit(1)
                                Text(actor.character ?? "")
                                    .font(AppFont.captionSmall())
                                    .foregroundStyle(Color.textMuted)
                                    .lineLimit(1)
                            }
                            .frame(width: 92)
                        }
                    }
                }
            } else {
                Text("Cast data unavailable.")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textMuted)
            }
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
        .padding(.horizontal, AppSpacing.md)
    }

    private var trailerBlock: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("Trailers")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            if viewModel.trailerVideos.isEmpty {
                Text("No trailers available.")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textMuted)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: AppSpacing.sm) {
                        ForEach(viewModel.trailerVideos, id: \.id) { video in
                            if let url = video.youtubeURL {
                                Link(destination: url) {
                                    VStack(alignment: .leading, spacing: 6) {
                                        Label("Play", systemImage: "play.circle.fill")
                                            .font(AppFont.caption())
                                            .foregroundStyle(Color.black)
                                        Text(video.name)
                                            .font(AppFont.caption())
                                            .foregroundStyle(Color.textPrimary)
                                            .lineLimit(2)
                                    }
                                    .padding(10)
                                    .frame(width: 180, alignment: .leading)
                                    .background(AppGradients.goldSoft)
                                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                                }
                            }
                        }
                    }
                }
            }
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
        .padding(.horizontal, AppSpacing.md)
    }

    private var personalNotesBlock: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("Your Notes")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            Toggle("Add personal rating", isOn: $hasRating)
                .font(AppFont.caption())
                .tint(.gold)

            if hasRating {
                VStack(alignment: .leading, spacing: 4) {
                    Slider(value: $userRating, in: 0...10, step: 0.5)
                        .tint(.gold)
                    Text("Rating: \(String(format: "%.1f", userRating))/10")
                        .font(AppFont.caption())
                        .foregroundStyle(Color.textSecondary)
                }
            }

            TextEditor(text: $notesDraft)
                .scrollContentBackground(.hidden)
                .frame(minHeight: 84)
                .padding(8)
                .background(Color.bgTertiary)
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                        .stroke(Color.borderDefault, lineWidth: 1)
                )

            Button("Save Personal Notes") {
                let id = watchlistStore.ensureSaved(route)
                watchlistStore.setNotes(notesDraft, for: id)
                watchlistStore.setRating(hasRating ? userRating : nil, for: id)
            }
            .font(AppFont.caption())
            .foregroundStyle(Color.black)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(AppGradients.gold)
            .clipShape(Capsule())
            .buttonStyle(.plain)
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
        .padding(.horizontal, AppSpacing.md)
    }

    private var similarBlock: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("Similar Titles")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            if let similar = viewModel.bundle?.similar, !similar.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: AppSpacing.sm) {
                        ForEach(similar.prefix(20), id: \.stableIdentifier) { item in
                            NavigationLink(value: item.route) {
                                VStack(alignment: .leading, spacing: 6) {
                                    AsyncImage(url: item.posterURL) { phase in
                                        switch phase {
                                        case .success(let image):
                                            image.resizable().scaledToFill()
                                        default:
                                            RoundedRectangle(cornerRadius: AppRadius.sm, style: .continuous)
                                                .fill(Color.bgTertiary)
                                        }
                                    }
                                    .frame(width: 110, height: 160)
                                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.sm, style: .continuous))

                                    Text(item.displayTitle)
                                        .font(AppFont.caption())
                                        .foregroundStyle(Color.textPrimary)
                                        .lineLimit(2)
                                        .frame(width: 110, alignment: .leading)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            } else {
                Text("No similar titles returned.")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textMuted)
            }
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
        .padding(.horizontal, AppSpacing.md)
    }

    private func providerRow(title: String, providers: [Provider]?) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            if let providers, !providers.isEmpty {
                Text(title)
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textMuted)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(providers.prefix(10)) { provider in
                            Text(provider.providerName)
                                .font(AppFont.captionSmall())
                                .foregroundStyle(Color.textPrimary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 6)
                                .background(Color.bgTertiary)
                                .clipShape(Capsule())
                        }
                    }
                }
            }
        }
    }

    private func pill(_ text: String, color: Color) -> some View {
        Text(text)
            .font(AppFont.captionSmall())
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.13))
            .clipShape(Capsule())
    }

    private func syncEditorState() {
        guard let item = savedItem else {
            hasRating = false
            userRating = 7
            notesDraft = ""
            return
        }
        if let rating = item.userRating {
            hasRating = true
            userRating = rating
        } else {
            hasRating = false
        }
        notesDraft = item.userNotes ?? ""
    }
}
