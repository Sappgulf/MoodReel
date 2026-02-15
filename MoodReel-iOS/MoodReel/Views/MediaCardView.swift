import SwiftUI

struct MediaCardView: View {
    let item: MediaResult
    let isSaved: Bool
    let onTap: () -> Void
    let onToggleSave: () -> Void
    @State private var isPressed = false
    @State private var showSaveAnimation = false

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
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
                }

                Spacer(minLength: 0)

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.textMuted)
                    .padding(.top, 8)
            }
            .contentShape(Rectangle())
            .onTapGesture(perform: onTap)

            Button(action: onToggleSave) {
                Label(
                    isSaved ? "Saved" : "Save to Watchlist",
                    systemImage: isSaved ? "checkmark.circle.fill" : "plus.circle.fill"
                )
                .font(AppFont.caption())
                .foregroundStyle(isSaved ? Color.success : Color.black)
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(
                    Group {
                        if isSaved {
                            Color.success.opacity(0.14)
                        } else {
                            AppGradients.gold
                        }
                    }
                )
                .clipShape(Capsule())
            }
            .buttonStyle(.plain)
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
        .goldBorder(cornerRadius: AppRadius.lg, opacity: isSaved ? 0.5 : 0.25, animated: isSaved)
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .opacity(isPressed ? 0.9 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isPressed)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
        .overlay(
            Group {
                if showSaveAnimation {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(Color.gold)
                        .transition(.scale.combined(with: .opacity))
                }
            }
        )
        .onChange(of: isSaved) { oldValue, newValue in
            if newValue && !oldValue {
                withAnimation(.spring(response: 0.3)) {
                    showSaveAnimation = true
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                    withAnimation {
                        showSaveAnimation = false
                    }
                }
            }
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
                            colors: [.clear, Color.black.opacity(0.3)],
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
        .frame(width: 92, height: 138)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
        .shadow(color: Color.black.opacity(0.3), radius: 8, x: 0, y: 4)
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
