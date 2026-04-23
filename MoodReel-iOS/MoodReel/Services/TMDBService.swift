import Foundation

enum TMDBServiceError: LocalizedError {
    case missingAPIKey
    case invalidURL
    case badResponse(statusCode: Int)
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return "Add your TMDB API key in Settings to fetch recommendations."
        case .invalidURL:
            return "Failed to create a valid TMDB request URL."
        case .badResponse(let statusCode):
            return "TMDB request failed with status code \(statusCode)."
        case .decodingFailed:
            return "Could not read TMDB response data."
        }
    }
}

actor TMDBResponseCache {
    struct Entry {
        let data: Data
        let expiry: Date
    }

    private var store: [String: Entry] = [:]

    func data(for key: String) -> Data? {
        guard let entry = store[key] else { return nil }
        if entry.expiry < Date() {
            store[key] = nil
            return nil
        }
        return entry.data
    }

    func setData(_ data: Data, for key: String, ttl: TimeInterval) {
        store[key] = Entry(data: data, expiry: Date().addingTimeInterval(ttl))
    }
}

struct MediaDetailsBundle {
    let route: MediaRoute
    let movieDetail: MovieDetail?
    let tvDetail: TVShowDetail?
    let credits: Credits?
    let videos: [Video]
    let watchProviders: RegionProviders?
    let similar: [MediaResult]
}

struct TMDBService {
    private static let cache = TMDBResponseCache()
    private static let cacheTTL: TimeInterval = 300
    private let decoder = JSONDecoder()

    func discover(mood: MoodType, query: String = "", page: Int = 1) async throws -> [MediaResult] {
        guard APIKeyStore.shared.isSet else {
            throw TMDBServiceError.missingAPIKey
        }

        if query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            async let movies: PaginatedResponse<Movie> = request(
                endpoint: "/discover/movie",
                params: [
                    "page": "\(page)",
                    "include_adult": "false",
                    "with_genres": mood.genreIds.map(String.init).joined(separator: ","),
                    "sort_by": "popularity.desc",
                    "vote_count.gte": "120"
                ]
            )

            async let shows: PaginatedResponse<TVShow> = request(
                endpoint: "/discover/tv",
                params: [
                    "page": "\(page)",
                    "include_adult": "false",
                    "with_genres": mood.genreIds.map(String.init).joined(separator: ","),
                    "sort_by": "popularity.desc",
                    "vote_count.gte": "80"
                ]
            )

            let combined = try await movies.results.map(MediaResult.movie)
                + shows.results.map(MediaResult.tvShow)
            return dedupeAndSort(combined)
        }

        let normalizedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        async let movieSearch: PaginatedResponse<Movie> = request(
            endpoint: "/search/movie",
            params: [
                "query": normalizedQuery,
                "page": "\(page)",
                "include_adult": "false"
            ]
        )

        async let tvSearch: PaginatedResponse<TVShow> = request(
            endpoint: "/search/tv",
            params: [
                "query": normalizedQuery,
                "page": "\(page)",
                "include_adult": "false"
            ]
        )

        let combined = try await movieSearch.results.map(MediaResult.movie)
            + tvSearch.results.map(MediaResult.tvShow)
        return dedupeAndSort(combined)
    }

    func trending(page: Int = 1) async throws -> [MediaResult] {
        guard APIKeyStore.shared.isSet else {
            throw TMDBServiceError.missingAPIKey
        }

        async let movies: PaginatedResponse<Movie> = request(
            endpoint: "/trending/movie/day",
            params: ["page": "\(page)"]
        )

        async let shows: PaginatedResponse<TVShow> = request(
            endpoint: "/trending/tv/day",
            params: ["page": "\(page)"]
        )

        let combined = try await movies.results.map(MediaResult.movie)
            + shows.results.map(MediaResult.tvShow)
        return dedupeAndSort(combined)
    }

    func mediaDetails(for route: MediaRoute) async throws -> MediaDetailsBundle {
        guard APIKeyStore.shared.isSet else {
            throw TMDBServiceError.missingAPIKey
        }

        let pathPrefix = mediaPathPrefix(for: route.mediaType)

        async let creditsTask: Credits? = requestOptional(
            endpoint: "/\(pathPrefix)/\(route.mediaId)/credits",
            params: [:]
        )

        async let videosTask: VideoResult? = requestOptional(
            endpoint: "/\(pathPrefix)/\(route.mediaId)/videos",
            params: [:]
        )

        async let providersTask: WatchProvidersResponse? = requestOptional(
            endpoint: "/\(pathPrefix)/\(route.mediaId)/watch/providers",
            params: [:]
        )

        let similar = try await similarTitles(for: route)

        let movieDetail: MovieDetail?
        let tvDetail: TVShowDetail?
        switch route.mediaType {
        case .movie:
            movieDetail = try await request(
                endpoint: "/movie/\(route.mediaId)",
                params: ["append_to_response": "release_dates"]
            )
            tvDetail = nil
        case .tv:
            tvDetail = try await request(
                endpoint: "/tv/\(route.mediaId)",
                params: ["append_to_response": "content_ratings"]
            )
            movieDetail = nil
        default:
            movieDetail = nil
            tvDetail = nil
        }

        let providersResponse = await providersTask
        let region = Locale.current.region?.identifier ?? "US"
        let providers = providersResponse?.results[region] ?? providersResponse?.results.first?.value

        return MediaDetailsBundle(
            route: route,
            movieDetail: movieDetail,
            tvDetail: tvDetail,
            credits: await creditsTask,
            videos: await videosTask?.results ?? [],
            watchProviders: providers,
            similar: similar
        )
    }

    private func similarTitles(for route: MediaRoute) async throws -> [MediaResult] {
        switch route.mediaType {
        case .movie:
            let response: PaginatedResponse<Movie> = try await request(
                endpoint: "/movie/\(route.mediaId)/similar",
                params: ["page": "1"]
            )
            return response.results.map(MediaResult.movie)
        case .tv:
            let response: PaginatedResponse<TVShow> = try await request(
                endpoint: "/tv/\(route.mediaId)/similar",
                params: ["page": "1"]
            )
            return response.results.map(MediaResult.tvShow)
        default:
            return []
        }
    }

    private func mediaPathPrefix(for mediaType: MediaType) -> String {
        switch mediaType {
        case .movie: return "movie"
        case .tv: return "tv"
        case .person: return "person"
        }
    }

    private func requestOptional<T: Decodable>(endpoint: String, params: [String: String]) async -> T? {
        do {
            return try await request(endpoint: endpoint, params: params)
        } catch {
            #if DEBUG
            print("[TMDBService] Optional request failed: \(endpoint) - \(error.localizedDescription)")
            #endif
            return nil
        }
    }

    private func request<T: Decodable>(endpoint: String, params: [String: String]) async throws -> T {
        let authParams = APIKeyStore.shared.addAPIKey(to: params)
        guard let url = TMDBConfig.buildURL(endpoint, params: authParams) else {
            throw TMDBServiceError.invalidURL
        }

        let cacheKey = cacheKeyFor(endpoint: endpoint, params: authParams)
        if let cachedData = await Self.cache.data(for: cacheKey) {
            do {
                return try decoder.decode(T.self, from: cachedData)
            } catch {
                // Fall through to refetch if cached payload cannot decode.
            }
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = 18
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw TMDBServiceError.badResponse(statusCode: -1)
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            throw TMDBServiceError.badResponse(statusCode: httpResponse.statusCode)
        }

        await Self.cache.setData(data, for: cacheKey, ttl: Self.cacheTTL)

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw TMDBServiceError.decodingFailed
        }
    }

    private func dedupeAndSort(_ items: [MediaResult]) -> [MediaResult] {
        var seen = Set<String>()
        let deduped = items.filter { item in
            let key = "\(item.mediaType.rawValue)-\(item.id)"
            if seen.contains(key) {
                return false
            }
            seen.insert(key)
            return true
        }
        return deduped.sorted { $0.popularity > $1.popularity }
    }

    private func cacheKeyFor(endpoint: String, params: [String: String]) -> String {
        let orderedParams = params
            .sorted { $0.key < $1.key }
            .map { "\($0.key)=\($0.value)" }
            .joined(separator: "&")
        return "\(endpoint)?\(orderedParams)"
    }
}
