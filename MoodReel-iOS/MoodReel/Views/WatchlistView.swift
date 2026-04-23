import SwiftUI

struct WatchlistView: View {
    enum Filter: String, CaseIterable, Identifiable {
        case all = "All"
        case unwatched = "Unwatched"
        case watched = "Watched"

        var id: String { rawValue }
    }

    @EnvironmentObject private var watchlistStore: WatchlistStore
    @State private var navigationPath: [MediaRoute] = []
    @State private var randomMessage: String?
    @State private var filter: Filter = .all
    @State private var searchQuery = ""

    var body: some View {
        NavigationStack(path: $navigationPath) {
            ZStack {
                LinearGradient(
                    colors: [Color.bgPrimary, Color.bgSecondary],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                if watchlistStore.items.isEmpty {
                    emptyState
                } else {
                    List {
                        Section {
                            statsHeader
                            filterBar
                        }
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                        .listRowInsets(EdgeInsets())

                        ForEach(filteredItems) { item in
                            WatchlistRow(
                                item: item,
                                onTap: {
                                    navigationPath.append(item.route)
                                },
                                onToggleWatched: {
                                    watchlistStore.setWatched(!item.isWatched, for: item.id)
                                },
                                onRemove: {
                                    watchlistStore.remove(id: item.id)
                                }
                            )
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                            .listRowInsets(EdgeInsets(top: 0, leading: AppSpacing.md, bottom: AppSpacing.md, trailing: AppSpacing.md))
                        }

                        if filteredItems.isEmpty {
                            Text("No titles match this filter.")
                                .font(AppFont.body())
                                .foregroundStyle(Color.textSecondary)
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding(.vertical, AppSpacing.lg)
                                .listRowBackground(Color.clear)
                                .listRowSeparator(.hidden)
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            }
            .navigationTitle("Watchlist")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        if let random = watchlistStore.randomUnwatched() {
                            navigationPath.append(random.route)
                        } else {
                            randomMessage = "Everything here is marked as watched."
                        }
                    } label: {
                        Label("Pick", systemImage: "shuffle")
                            .font(AppFont.caption())
                    }
                    .tint(.gold)
                }
            }
            .navigationDestination(for: MediaRoute.self) { route in
                MediaDetailView(route: route)
            }
        }
        .alert(
            "Random Pick",
            isPresented: Binding(
                get: { randomMessage != nil },
                set: { isPresented in
                    if !isPresented { randomMessage = nil }
                }
            )
        ) {
            Button("Done") { randomMessage = nil }
        } message: {
            Text(randomMessage ?? "")
        }
    }

    private var filteredItems: [WatchlistItem] {
        let base: [WatchlistItem]
        switch filter {
        case .all:
            base = watchlistStore.sortedItems
        case .unwatched:
            base = watchlistStore.sortedItems.filter { !$0.isWatched }
        case .watched:
            base = watchlistStore.sortedItems.filter { $0.isWatched }
        }

        let trimmed = searchQuery.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return base }
        return base.filter { $0.title.localizedCaseInsensitiveContains(trimmed) }
    }

    private var statsHeader: some View {
        HStack(spacing: AppSpacing.sm) {
            statPill(title: "Saved", value: "\(watchlistStore.items.count)")
            statPill(title: "Unwatched", value: "\(watchlistStore.unwatchedItems.count)")
            statPill(title: "Watched", value: "\(watchlistStore.watchedItems.count)")
        }
    }

    private var filterBar: some View {
        VStack(spacing: AppSpacing.sm) {
            TextField("Search watchlist", text: $searchQuery)
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
                ForEach(Filter.allCases) { entry in
                    Button {
                        filter = entry
                    } label: {
                        Text(entry.rawValue)
                            .font(AppFont.caption())
                            .foregroundStyle(filter == entry ? Color.black : Color.textSecondary)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 7)
                            .background(filter == entry ? AnyShapeStyle(AppGradients.gold) : AnyShapeStyle(Color.bgTertiary))
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
                Spacer()
            }
        }
    }

    private func statPill(title: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(AppFont.subheadline())
                .foregroundStyle(Color.gold)
            Text(title)
                .font(AppFont.caption())
                .foregroundStyle(Color.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color.bgTertiary)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
    }

    private var emptyState: some View {
        VStack(spacing: AppSpacing.md) {
            Image(systemName: "bookmark.slash")
                .font(.system(size: 42))
                .foregroundStyle(Color.textMuted)

            Text("No saved titles yet")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            Text("Save movies or shows from Discover to build your watchlist.")
                .font(AppFont.body())
                .foregroundStyle(Color.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, AppSpacing.lg)
        }
        .padding(AppSpacing.lg)
        .glassCard(cornerRadius: AppRadius.xl, backgroundOpacity: 1)
        .padding(.horizontal, AppSpacing.md)
    }
}

#Preview("Watchlist") {
    WatchlistView()
        .environmentObject(WatchlistStore())
}

private struct WatchlistRow: View {
    let item: WatchlistItem
    let onTap: () -> Void
    let onToggleWatched: () -> Void
    let onRemove: () -> Void
    @State private var isPressed = false

    var body: some View {
        HStack(alignment: .top, spacing: AppSpacing.md) {
            poster

            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text(item.title)
                    .font(AppFont.subheadline())
                    .foregroundStyle(Color.textPrimary)
                    .lineLimit(2)

                HStack(spacing: AppSpacing.sm) {
                    Text(item.mediaType.displayName)
                    if let year = item.releaseYear { Text(year) }
                    Text("★ \(String(format: "%.1f", item.voteAverage))")
                }
                .font(AppFont.caption())
                .foregroundStyle(Color.textSecondary)

                HStack(spacing: AppSpacing.sm) {
                    if item.isWatched {
                        Label("Watched", systemImage: "checkmark.circle.fill")
                            .font(AppFont.caption())
                            .foregroundStyle(Color.success)
                    } else {
                        Label("To Watch", systemImage: "clock")
                            .font(AppFont.caption())
                            .foregroundStyle(Color.gold)
                    }

                    if item.isFavorite {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.crimson)
                    }

                    if let rating = item.userRating {
                        Text("Your \(String(format: "%.1f", rating))")
                            .font(AppFont.captionSmall())
                            .foregroundStyle(Color.gold)
                    }
                }
                .padding(.top, 4)
            }

            Spacer(minLength: 0)

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Color.textMuted)
                .padding(.top, 6)
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onTap)
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .opacity(isPressed ? 0.9 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isPressed)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) {
                withAnimation {
                    onRemove()
                }
            } label: {
                Label("Delete", systemImage: "trash")
            }
            .tint(.red)
        }
        .swipeActions(edge: .leading, allowsFullSwipe: false) {
            Button {
                onToggleWatched()
            } label: {
                Label(item.isWatched ? "Unwatched" : "Watched", 
                      systemImage: item.isWatched ? "xmark.circle" : "checkmark.circle")
            }
            .tint(item.isWatched ? .orange : .green)
        }
    }

    private var poster: some View {
        AsyncImage(url: item.posterURL) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .scaledToFill()
                    .overlay(
                        LinearGradient(
                            colors: [.clear, Color.black.opacity(0.2)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
            case .failure:
                placeholderPoster
            case .empty:
                placeholderPoster.shimmerEffect()
            @unknown default:
                placeholderPoster
            }
        }
        .frame(width: 76, height: 114)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.sm, style: .continuous))
        .shadow(color: Color.black.opacity(0.2), radius: 4, x: 0, y: 2)
    }

    private var placeholderPoster: some View {
        RoundedRectangle(cornerRadius: AppRadius.sm, style: .continuous)
            .fill(Color.bgTertiary)
            .overlay(
                Image(systemName: "film")
                    .foregroundStyle(Color.textMuted)
            )
    }
}
