import SwiftUI

// MARK: - Continue Watching Rail
//
// Surfaces watchlist items the user has already engaged with but not yet
// marked as watched. Mirrors the web's `ContinueWatchingStrip` semantics
// (open-but-not-watched, skipping disliked) using the closest iOS equivalent:
// the user's saved watchlist, filtered against `WatchlistStore.watchedKeys`
// and `TasteProfileStore.dislikedIds`.

struct ContinueWatchingRail: View {
    let watchlist: [WatchlistItem]
    let dislikedIds: Set<String>
    let onTap: (WatchlistItem) -> Void

    private static let maxItems = 8

    private var visibleItems: [WatchlistItem] {
        watchlist
            .filter { !$0.isWatched }
            .filter { !dislikedIds.contains(tasteKey(for: $0)) }
            .sorted { $0.dateAdded > $1.dateAdded }
            .prefix(Self.maxItems)
            .map { $0 }
    }

    var body: some View {
        if !visibleItems.isEmpty {
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                header
                itemsScroll
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Continue Watching")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)
            Text("Saved titles you haven't marked watched yet.")
                .font(AppFont.caption())
                .foregroundStyle(Color.textSecondary)
        }
    }

    private var itemsScroll: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: AppSpacing.sm) {
                ForEach(visibleItems) { item in
                    Button {
                        onTap(item)
                    } label: {
                        ContinueWatchingCard(item: item)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Open \(item.title) from Continue Watching")
                }
            }
        }
    }
}

// MARK: - Card

private struct ContinueWatchingCard: View {
    let item: WatchlistItem

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            poster
            VStack(alignment: .leading, spacing: 2) {
                Text(item.title)
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textPrimary)
                    .lineLimit(2)
                    .frame(width: 110, alignment: .leading)

                HStack(spacing: 4) {
                    Image(systemName: "play.circle")
                        .font(.system(size: 9, weight: .bold))
                    Text("Resume")
                        .font(AppFont.captionSmall())
                }
                .foregroundStyle(Color.gold)
            }
        }
        .frame(width: 110, alignment: .leading)
    }

    private var poster: some View {
        AsyncImage(url: item.posterURL) { phase in
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
        .frame(width: 110, height: 160)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
        .overlay(
            LinearGradient(
                colors: [.clear, Color.black.opacity(0.35)],
                startPoint: .top,
                endPoint: .bottom
            )
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
        )
    }

    private var placeholder: some View {
        RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
            .fill(Color.bgTertiary)
            .overlay(
                Image(systemName: "film")
                    .font(.system(size: 22))
                    .foregroundStyle(Color.textMuted)
            )
    }
}

// MARK: - Helpers

private func tasteKey(for item: WatchlistItem) -> String {
    "\(item.mediaId)-\(item.mediaType.rawValue)"
}
