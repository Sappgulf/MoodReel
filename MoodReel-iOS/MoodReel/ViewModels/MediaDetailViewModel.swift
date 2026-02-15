import Foundation

@MainActor
final class MediaDetailViewModel: ObservableObject {
    @Published var bundle: MediaDetailsBundle?
    @Published var isLoading = false
    @Published var errorMessage: String?

    let route: MediaRoute
    private let service: TMDBService

    init(route: MediaRoute, service: TMDBService = TMDBService()) {
        self.route = route
        self.service = service
    }

    var displayTitle: String {
        bundle?.movieDetail?.title ?? bundle?.tvDetail?.name ?? route.title
    }

    var overview: String {
        bundle?.movieDetail?.overview ??
        bundle?.tvDetail?.overview ??
        route.overview ??
        "No synopsis available."
    }

    var releaseYear: String? {
        bundle?.movieDetail?.releaseYear ?? bundle?.tvDetail?.firstAirYear ?? route.releaseYear
    }

    var ratingText: String {
        if let value = bundle?.movieDetail?.voteAverage {
            return String(format: "%.1f", value)
        }
        if let value = bundle?.tvDetail?.voteAverage {
            return String(format: "%.1f", value)
        }
        return String(format: "%.1f", route.voteAverage)
    }

    var runtimeText: String? {
        if let runtime = bundle?.movieDetail?.runtimeFormatted {
            return runtime
        }
        return bundle?.tvDetail?.averageRuntime
    }

    var genresText: String? {
        if let genres = bundle?.movieDetail?.genres, !genres.isEmpty {
            return genres.prefix(4).map(\.name).joined(separator: " • ")
        }
        if let genres = bundle?.tvDetail?.genres, !genres.isEmpty {
            return genres.prefix(4).map(\.name).joined(separator: " • ")
        }
        return nil
    }

    var backdropURL: URL? {
        if let path = bundle?.movieDetail?.backdropPath {
            return TMDBConfig.backdropURL(path)
        }
        if let path = bundle?.tvDetail?.backdropPath {
            return TMDBConfig.backdropURL(path)
        }
        return TMDBConfig.backdropURL(route.backdropPath)
    }

    var trailerVideos: [Video] {
        guard let videos = bundle?.videos else { return [] }
        let filtered = videos.filter { video in
            video.site.caseInsensitiveCompare("youtube") == .orderedSame &&
            (video.isTrailer || video.isTeaser)
        }
        return Array(filtered.prefix(6))
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            bundle = try await service.mediaDetails(for: route)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
