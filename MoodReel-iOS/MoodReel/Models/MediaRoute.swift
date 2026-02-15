import Foundation

struct MediaRoute: Hashable, Identifiable {
    let mediaId: Int
    let mediaType: MediaType
    let title: String
    let posterPath: String?
    let backdropPath: String?
    let overview: String?
    let releaseYear: String?
    let voteAverage: Double

    var id: String {
        "\(mediaType.rawValue)-\(mediaId)"
    }
}

extension MediaResult {
    var route: MediaRoute {
        MediaRoute(
            mediaId: id,
            mediaType: mediaType,
            title: displayTitle,
            posterPath: posterPath,
            backdropPath: backdropPath,
            overview: overview,
            releaseYear: releaseYear,
            voteAverage: voteAverage
        )
    }
}

extension WatchlistItem {
    var route: MediaRoute {
        MediaRoute(
            mediaId: mediaId,
            mediaType: mediaType,
            title: title,
            posterPath: posterPath,
            backdropPath: backdropPath,
            overview: overview,
            releaseYear: releaseYear,
            voteAverage: voteAverage
        )
    }
}
