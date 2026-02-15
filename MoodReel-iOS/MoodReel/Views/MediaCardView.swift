import SwiftUI

struct MediaCardView: View {
    let item: MediaResult
    let isSaved: Bool
    let onToggleSave: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: AppSpacing.md) {
            poster

            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                Text(item.displayTitle)
                    .font(AppFont.headline())
                    .foregroundStyle(Color.textPrimary)
                    .lineLimit(2)

                HStack(spacing: AppSpacing.sm) {
                    pill(text: item.mediaType.displayName, color: .amber)

                    if let year = item.releaseYear {
                        pill(text: year, color: .textMuted)
                    }

                    pill(text: "★ \(item.ratingFormatted)", color: .gold)
                }

                if let overview = item.overview, !overview.isEmpty {
                    Text(overview)
                        .font(AppFont.caption())
                        .foregroundStyle(Color.textSecondary)
                        .lineLimit(3)
                }

                if !item.genreNames.isEmpty {
                    Text(item.genreNames.joined(separator: " • "))
                        .font(AppFont.caption())
                        .foregroundStyle(Color.textMuted)
                        .lineLimit(1)
                }

                Button(action: onToggleSave) {
                    Label(
                        isSaved ? "Saved" : "Save to Watchlist",
                        systemImage: isSaved ? "checkmark.circle.fill" : "plus.circle.fill"
                    )
                    .font(AppFont.caption())
                    .foregroundStyle(isSaved ? Color.success : Color.gold)
                }
                .buttonStyle(.plain)
                .padding(.top, 2)
            }

            Spacer(minLength: 0)
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
        .goldBorder(cornerRadius: AppRadius.lg, opacity: 0.25)
    }

    private var poster: some View {
        AsyncImage(url: item.posterURL) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .scaledToFill()
            case .failure:
                placeholderPoster
            case .empty:
                placeholderPoster.shimmerEffect()
            @unknown default:
                placeholderPoster
            }
        }
        .frame(width: 92, height: 138)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
    }

    private var placeholderPoster: some View {
        RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
            .fill(Color.bgTertiary)
            .overlay(
                Image(systemName: "film")
                    .font(.system(size: 24))
                    .foregroundStyle(Color.textMuted)
            )
    }

    private func pill(text: String, color: Color) -> some View {
        Text(text)
            .font(AppFont.captionSmall())
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.12))
            .clipShape(Capsule())
    }
}

private extension MediaResult {
    var genreNames: [String] {
        switch self {
        case .movie(let movie):
            return (movie.genreIds ?? [])
                .prefix(2)
                .map { GenreConstants.name(for: $0, mediaType: .movie) }
        case .tvShow(let show):
            return (show.genreIds ?? [])
                .prefix(2)
                .map { GenreConstants.name(for: $0, mediaType: .tv) }
        }
    }
}
