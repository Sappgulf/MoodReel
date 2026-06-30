import SwiftUI

// MARK: - On My Services Rail
//
// Shows trending titles that stream on the user's selected providers in their
// saved region. Mirrors the web's `OnMyServicesStrip`: fetch trending, look up
// per-title providers, keep the ones that overlap with the user's saved
// service IDs, and render up to 6.

struct OnMyServicesRail: View {
    let serviceIds: Set<Int>
    let region: String
    let onTap: (MediaResult) -> Void

    @State private var items: [MediaResult] = []
    @State private var isLoading = true
    @State private var hasAttempted = false
    @State private var hasError = false

    private let service = TMDBService()
    private static let maxItems = 6
    private static let lookupLimit = 12

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            header
            content
        }
        .task(id: loadKey) {
            await load()
        }
    }

    private var loadKey: String {
        let ids = serviceIds.sorted().map(String.init).joined(separator: ",")
        return "\(ids)|\(region)"
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("On Your Services")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)
            Text("Trending picks streaming on your saved services in \(region).")
                .font(AppFont.caption())
                .foregroundStyle(Color.textSecondary)
        }
    }

    @ViewBuilder
    private var content: some View {
        if isLoading && items.isEmpty {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.sm) {
                    ForEach(0..<4, id: \.self) { _ in
                        skeletonCard
                    }
                }
            }
        } else if items.isEmpty {
            if hasError {
                Text("Couldn't load provider info right now.")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textMuted)
            } else if hasAttempted {
                Text("No trending picks match your selected services in \(region) yet.")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textMuted)
            }
        } else {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.sm) {
                    ForEach(items) { item in
                        Button {
                            onTap(item)
                        } label: {
                            OnMyServicesCard(item: item)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Open \(item.displayTitle) from On Your Services")
                    }
                }
            }
        }
    }

    private var skeletonCard: some View {
        RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
            .fill(Color.bgTertiary)
            .frame(width: 110, height: 160)
            .shimmerEffect()
    }

    private func load() async {
        guard !serviceIds.isEmpty else {
            isLoading = false
            items = []
            hasAttempted = true
            return
        }

        isLoading = true
        hasError = false
        defer { isLoading = false }

        do {
            let trending = try await service.trending(page: 1)
            let lookup = Array(trending.prefix(Self.lookupLimit))

            let withProviders: [(MediaResult, RegionProviders?)] = await withTaskGroup(
                of: (Int, (MediaResult, RegionProviders?)).self
            ) { group in
                for (index, item) in lookup.enumerated() {
                    group.addTask { [service] in
                        let providers = await service.watchProviders(for: item.route, region: region)
                        return (index, (item, providers))
                    }
                }

                var results: [(Int, (MediaResult, RegionProviders?))] = []
                for await pair in group {
                    results.append(pair)
                }
                return results.sorted { $0.0 < $1.0 }.map { $0.1 }
            }

            let filtered = withProviders.compactMap { item, providers -> MediaResult? in
                guard let providers, providers.matchesAnyService(serviceIds) else { return nil }
                return item
            }

            items = Array(filtered.prefix(Self.maxItems))
            hasAttempted = true
        } catch {
            items = []
            hasAttempted = true
            hasError = true
        }
    }
}

// MARK: - Card

private struct OnMyServicesCard: View {
    let item: MediaResult

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            poster
            VStack(alignment: .leading, spacing: 2) {
                Text(item.displayTitle)
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textPrimary)
                    .lineLimit(2)
                    .frame(width: 110, alignment: .leading)

                if let year = item.releaseYear {
                    Text(year)
                        .font(AppFont.captionSmall())
                        .foregroundStyle(Color.textMuted)
                }
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
                colors: [.clear, Color.black.opacity(0.4)],
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
