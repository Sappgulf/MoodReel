import Foundation

// MARK: - Media Type

enum MediaType: String, Codable, CaseIterable {
    case movie
    case tv
    case person

    var displayName: String {
        switch self {
        case .movie: return "Movie"
        case .tv: return "TV Show"
        case .person: return "Person"
        }
    }
}

// MARK: - Base Media Protocol

protocol MediaItem: Identifiable, Codable {
    var id: Int { get }
    var overview: String? { get }
    var posterPath: String? { get }
    var backdropPath: String? { get }
    var voteAverage: Double { get }
    var voteCount: Int { get }
    var popularity: Double { get }
    var genreIds: [Int]? { get }
    var mediaType: MediaType? { get }

    var displayTitle: String { get }
    var displayDate: String? { get }
    var posterURL: URL? { get }
    var backdropURL: URL? { get }
    var ratingFormatted: String { get }
}

extension MediaItem {
    var posterURL: URL? {
        guard let path = posterPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w500\(path)")
    }

    var backdropURL: URL? {
        guard let path = backdropPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w1280\(path)")
    }

    var ratingFormatted: String {
        String(format: "%.1f", voteAverage)
    }
}

// MARK: - Movie

struct Movie: MediaItem, Hashable {
    let id: Int
    let title: String
    let originalTitle: String?
    let overview: String?
    let posterPath: String?
    let backdropPath: String?
    let voteAverage: Double
    let voteCount: Int
    let releaseDate: String?
    let genreIds: [Int]?
    let popularity: Double
    let adult: Bool?
    let originalLanguage: String?
    let video: Bool?
    let mediaType: MediaType?

    var displayTitle: String { title }
    var displayDate: String? { releaseDate }

    var releaseYear: String? {
        guard let date = releaseDate, date.count >= 4 else { return nil }
        return String(date.prefix(4))
    }

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case originalTitle = "original_title"
        case overview
        case posterPath = "poster_path"
        case backdropPath = "backdrop_path"
        case voteAverage = "vote_average"
        case voteCount = "vote_count"
        case releaseDate = "release_date"
        case genreIds = "genre_ids"
        case popularity
        case adult
        case originalLanguage = "original_language"
        case video
        case mediaType = "media_type"
    }
}

// MARK: - TV Show

struct TVShow: MediaItem, Hashable {
    let id: Int
    let name: String
    let originalName: String?
    let overview: String?
    let posterPath: String?
    let backdropPath: String?
    let voteAverage: Double
    let voteCount: Int
    let firstAirDate: String?
    let genreIds: [Int]?
    let popularity: Double
    let originCountry: [String]?
    let originalLanguage: String?
    let mediaType: MediaType?

    var displayTitle: String { name }
    var displayDate: String? { firstAirDate }

    var firstAirYear: String? {
        guard let date = firstAirDate, date.count >= 4 else { return nil }
        return String(date.prefix(4))
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case originalName = "original_name"
        case overview
        case posterPath = "poster_path"
        case backdropPath = "backdrop_path"
        case voteAverage = "vote_average"
        case voteCount = "vote_count"
        case firstAirDate = "first_air_date"
        case genreIds = "genre_ids"
        case popularity
        case originCountry = "origin_country"
        case originalLanguage = "original_language"
        case mediaType = "media_type"
    }
}

// MARK: - Multi Search Result (Movie or TV)

enum MediaResult: Codable, Identifiable, Hashable {
    case movie(Movie)
    case tvShow(TVShow)

    var id: Int {
        switch self {
        case .movie(let m): return m.id
        case .tvShow(let t): return t.id
        }
    }

    var mediaType: MediaType {
        switch self {
        case .movie: return .movie
        case .tvShow: return .tv
        }
    }

    var displayTitle: String {
        switch self {
        case .movie(let m): return m.displayTitle
        case .tvShow(let t): return t.displayTitle
        }
    }

    var posterPath: String? {
        switch self {
        case .movie(let m): return m.posterPath
        case .tvShow(let t): return t.posterPath
        }
    }

    var backdropPath: String? {
        switch self {
        case .movie(let m): return m.backdropPath
        case .tvShow(let t): return t.backdropPath
        }
    }

    var voteAverage: Double {
        switch self {
        case .movie(let m): return m.voteAverage
        case .tvShow(let t): return t.voteAverage
        }
    }

    var popularity: Double {
        switch self {
        case .movie(let m): return m.popularity
        case .tvShow(let t): return t.popularity
        }
    }

    var overview: String? {
        switch self {
        case .movie(let m): return m.overview
        case .tvShow(let t): return t.overview
        }
    }

    var releaseYear: String? {
        switch self {
        case .movie(let m): return m.releaseYear
        case .tvShow(let t): return t.firstAirYear
        }
    }

    var posterURL: URL? {
        guard let path = posterPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w500\(path)")
    }

    var backdropURL: URL? {
        guard let path = backdropPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w1280\(path)")
    }

    var ratingFormatted: String {
        String(format: "%.1f", voteAverage)
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: DynamicCodingKey.self)
        let mediaTypeRaw = try? container.decode(String.self, forKey: DynamicCodingKey(stringValue: "media_type"))
        let hasTitle = container.contains(DynamicCodingKey(stringValue: "title"))
        let hasName = container.contains(DynamicCodingKey(stringValue: "name"))

        if mediaTypeRaw == "tv" || (hasName && !hasTitle) {
            let show = try TVShow(from: decoder)
            self = .tvShow(show)
        } else {
            let movie = try Movie(from: decoder)
            self = .movie(movie)
        }
    }

    func encode(to encoder: Encoder) throws {
        switch self {
        case .movie(let m): try m.encode(to: encoder)
        case .tvShow(let t): try t.encode(to: encoder)
        }
    }
}

private struct DynamicCodingKey: CodingKey {
    var stringValue: String
    var intValue: Int?

    init(stringValue: String) {
        self.stringValue = stringValue
        self.intValue = nil
    }

    init?(intValue: Int) {
        self.intValue = intValue
        self.stringValue = "\(intValue)"
    }
}

// MARK: - Movie Detail

struct MovieDetail: Codable, Identifiable {
    let id: Int
    let title: String
    let tagline: String?
    let overview: String?
    let posterPath: String?
    let backdropPath: String?
    let voteAverage: Double
    let voteCount: Int
    let releaseDate: String?
    let runtime: Int?
    let genres: [Genre]
    let status: String?
    let budget: Int?
    let revenue: Int?
    let homepage: String?
    let imdbId: String?
    let originalLanguage: String?
    let originalTitle: String?
    let popularity: Double
    let adult: Bool?
    let spokenLanguages: [SpokenLanguage]?
    let productionCountries: [ProductionCountry]?
    let productionCompanies: [ProductionCompany]?
    let belongsToCollection: Collection?

    var posterURL: URL? {
        guard let path = posterPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w500\(path)")
    }

    var backdropURL: URL? {
        guard let path = backdropPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w1280\(path)")
    }

    var releaseYear: String? {
        guard let date = releaseDate, date.count >= 4 else { return nil }
        return String(date.prefix(4))
    }

    var runtimeFormatted: String? {
        guard let runtime = runtime, runtime > 0 else { return nil }
        let hours = runtime / 60
        let minutes = runtime % 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }

    var ratingFormatted: String {
        String(format: "%.1f", voteAverage)
    }

    enum CodingKeys: String, CodingKey {
        case id, title, tagline, overview, status, budget, revenue, homepage, runtime, genres, popularity, adult
        case posterPath = "poster_path"
        case backdropPath = "backdrop_path"
        case voteAverage = "vote_average"
        case voteCount = "vote_count"
        case releaseDate = "release_date"
        case imdbId = "imdb_id"
        case originalLanguage = "original_language"
        case originalTitle = "original_title"
        case spokenLanguages = "spoken_languages"
        case productionCountries = "production_countries"
        case productionCompanies = "production_companies"
        case belongsToCollection = "belongs_to_collection"
    }
}

// MARK: - TV Show Detail

struct TVShowDetail: Codable, Identifiable {
    let id: Int
    let name: String
    let tagline: String?
    let overview: String?
    let posterPath: String?
    let backdropPath: String?
    let voteAverage: Double
    let voteCount: Int
    let firstAirDate: String?
    let lastAirDate: String?
    let genres: [Genre]
    let status: String?
    let type: String?
    let numberOfSeasons: Int?
    let numberOfEpisodes: Int?
    let episodeRunTime: [Int]?
    let homepage: String?
    let originalLanguage: String?
    let originalName: String?
    let popularity: Double
    let inProduction: Bool?
    let networks: [Network]?
    let seasons: [Season]?
    let createdBy: [Creator]?
    let originCountry: [String]?

    var posterURL: URL? {
        guard let path = posterPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w500\(path)")
    }

    var backdropURL: URL? {
        guard let path = backdropPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w1280\(path)")
    }

    var firstAirYear: String? {
        guard let date = firstAirDate, date.count >= 4 else { return nil }
        return String(date.prefix(4))
    }

    var averageRuntime: String? {
        guard let runtimes = episodeRunTime, !runtimes.isEmpty else { return nil }
        let avg = runtimes.reduce(0, +) / runtimes.count
        return "\(avg)m"
    }

    var ratingFormatted: String {
        String(format: "%.1f", voteAverage)
    }

    enum CodingKeys: String, CodingKey {
        case id, name, tagline, overview, status, type, homepage, genres, popularity, seasons, networks
        case posterPath = "poster_path"
        case backdropPath = "backdrop_path"
        case voteAverage = "vote_average"
        case voteCount = "vote_count"
        case firstAirDate = "first_air_date"
        case lastAirDate = "last_air_date"
        case numberOfSeasons = "number_of_seasons"
        case numberOfEpisodes = "number_of_episodes"
        case episodeRunTime = "episode_run_time"
        case originalLanguage = "original_language"
        case originalName = "original_name"
        case inProduction = "in_production"
        case createdBy = "created_by"
        case originCountry = "origin_country"
    }
}

// MARK: - Cast & Crew

struct Credits: Codable {
    let id: Int?
    let cast: [CastMember]
    let crew: [CrewMember]
}

struct CastMember: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let originalName: String?
    let character: String?
    let profilePath: String?
    let order: Int?
    let castId: Int?
    let creditId: String?
    let knownForDepartment: String?
    let popularity: Double?
    let adult: Bool?

    var profileURL: URL? {
        guard let path = profilePath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w185\(path)")
    }

    enum CodingKeys: String, CodingKey {
        case id, name, character, order, popularity, adult
        case originalName = "original_name"
        case profilePath = "profile_path"
        case castId = "cast_id"
        case creditId = "credit_id"
        case knownForDepartment = "known_for_department"
    }
}

struct CrewMember: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let originalName: String?
    let job: String?
    let department: String?
    let profilePath: String?
    let creditId: String?
    let knownForDepartment: String?
    let popularity: Double?
    let adult: Bool?

    var profileURL: URL? {
        guard let path = profilePath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w185\(path)")
    }

    enum CodingKeys: String, CodingKey {
        case id, name, job, department, popularity, adult
        case originalName = "original_name"
        case profilePath = "profile_path"
        case creditId = "credit_id"
        case knownForDepartment = "known_for_department"
    }
}

// MARK: - Video

struct VideoResult: Codable {
    let id: Int?
    let results: [Video]
}

struct Video: Codable, Identifiable, Hashable {
    let id: String
    let key: String
    let name: String
    let site: String
    let type: String
    let official: Bool?
    let publishedAt: String?
    let size: Int?
    let iso6391: String?
    let iso31661: String?

    var youtubeURL: URL? {
        guard site.lowercased() == "youtube" else { return nil }
        return URL(string: "https://www.youtube.com/watch?v=\(key)")
    }

    var youtubeThumbnailURL: URL? {
        guard site.lowercased() == "youtube" else { return nil }
        return URL(string: "https://img.youtube.com/vi/\(key)/maxresdefault.jpg")
    }

    var isTrailer: Bool {
        type.lowercased() == "trailer"
    }

    var isTeaser: Bool {
        type.lowercased() == "teaser"
    }

    enum CodingKeys: String, CodingKey {
        case id, key, name, site, type, official, size
        case publishedAt = "published_at"
        case iso6391 = "iso_639_1"
        case iso31661 = "iso_3166_1"
    }
}

// MARK: - Watch Providers

struct WatchProvidersResponse: Codable {
    let id: Int?
    let results: [String: RegionProviders]
}

struct RegionProviders: Codable {
    let link: String?
    let flatrate: [Provider]?
    let rent: [Provider]?
    let buy: [Provider]?
    let ads: [Provider]?
    let free: [Provider]?
}

struct Provider: Codable, Identifiable, Hashable {
    let providerId: Int
    let providerName: String
    let logoPath: String?
    let displayPriority: Int?

    var id: Int { providerId }

    var logoURL: URL? {
        guard let path = logoPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w92\(path)")
    }

    enum CodingKeys: String, CodingKey {
        case providerId = "provider_id"
        case providerName = "provider_name"
        case logoPath = "logo_path"
        case displayPriority = "display_priority"
    }
}

// MARK: - Genre

struct Genre: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
}

struct GenreList: Codable {
    let genres: [Genre]
}

// MARK: - Supporting Types

struct SpokenLanguage: Codable, Hashable {
    let iso6391: String?
    let name: String
    let englishName: String?

    enum CodingKeys: String, CodingKey {
        case name
        case iso6391 = "iso_639_1"
        case englishName = "english_name"
    }
}

struct ProductionCountry: Codable, Hashable {
    let iso31661: String?
    let name: String

    enum CodingKeys: String, CodingKey {
        case name
        case iso31661 = "iso_3166_1"
    }
}

struct ProductionCompany: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let logoPath: String?
    let originCountry: String?

    var logoURL: URL? {
        guard let path = logoPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w92\(path)")
    }

    enum CodingKeys: String, CodingKey {
        case id, name
        case logoPath = "logo_path"
        case originCountry = "origin_country"
    }
}

struct Collection: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let posterPath: String?
    let backdropPath: String?

    enum CodingKeys: String, CodingKey {
        case id, name
        case posterPath = "poster_path"
        case backdropPath = "backdrop_path"
    }
}

struct Network: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let logoPath: String?
    let originCountry: String?

    enum CodingKeys: String, CodingKey {
        case id, name
        case logoPath = "logo_path"
        case originCountry = "origin_country"
    }
}

struct Season: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let overview: String?
    let posterPath: String?
    let airDate: String?
    let episodeCount: Int?
    let seasonNumber: Int

    var posterURL: URL? {
        guard let path = posterPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w185\(path)")
    }

    enum CodingKeys: String, CodingKey {
        case id, name, overview
        case posterPath = "poster_path"
        case airDate = "air_date"
        case episodeCount = "episode_count"
        case seasonNumber = "season_number"
    }
}

struct Creator: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let profilePath: String?
    let creditId: String?
    let gender: Int?

    var profileURL: URL? {
        guard let path = profilePath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w185\(path)")
    }

    enum CodingKeys: String, CodingKey {
        case id, name, gender
        case profilePath = "profile_path"
        case creditId = "credit_id"
    }
}

// MARK: - Paginated Response

struct PaginatedResponse<T: Codable>: Codable {
    let page: Int
    let results: [T]
    let totalPages: Int
    let totalResults: Int

    enum CodingKeys: String, CodingKey {
        case page, results
        case totalPages = "total_pages"
        case totalResults = "total_results"
    }
}

// MARK: - Person

struct Person: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let biography: String?
    let birthday: String?
    let deathday: String?
    let gender: Int?
    let homepage: String?
    let imdbId: String?
    let knownForDepartment: String?
    let placeOfBirth: String?
    let popularity: Double
    let profilePath: String?
    let adult: Bool?
    let alsoKnownAs: [String]?

    var profileURL: URL? {
        guard let path = profilePath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w185\(path)")
    }

    var genderString: String? {
        switch gender {
        case 1: return "Female"
        case 2: return "Male"
        case 3: return "Non-binary"
        default: return nil
        }
    }

    enum CodingKeys: String, CodingKey {
        case id, name, biography, birthday, deathday, gender, homepage, popularity, adult
        case imdbId = "imdb_id"
        case knownForDepartment = "known_for_department"
        case placeOfBirth = "place_of_birth"
        case profilePath = "profile_path"
        case alsoKnownAs = "also_known_as"
    }
}

// MARK: - Images Response

struct ImagesResponse: Codable {
    let id: Int?
    let backdrops: [ImageItem]?
    let posters: [ImageItem]?
    let logos: [ImageItem]?
}

struct ImageItem: Codable, Hashable {
    let filePath: String
    let width: Int?
    let height: Int?
    let aspectRatio: Double?
    let voteAverage: Double?
    let voteCount: Int?
    let iso6391: String?

    var imageURL: URL? {
        URL(string: "https://image.tmdb.org/t/p/original\(filePath)")
    }

    enum CodingKeys: String, CodingKey {
        case width, height
        case filePath = "file_path"
        case aspectRatio = "aspect_ratio"
        case voteAverage = "vote_average"
        case voteCount = "vote_count"
        case iso6391 = "iso_639_1"
    }
}

// MARK: - Keyword

struct Keyword: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
}

struct KeywordsResponse: Codable {
    let id: Int?
    let keywords: [Keyword]?
    let results: [Keyword]?
}

// MARK: - Review

struct ReviewsResponse: Codable {
    let id: Int?
    let page: Int?
    let results: [Review]
    let totalPages: Int?
    let totalResults: Int?

    enum CodingKeys: String, CodingKey {
        case id, page, results
        case totalPages = "total_pages"
        case totalResults = "total_results"
    }
}

struct Review: Codable, Identifiable, Hashable {
    let id: String
    let author: String
    let content: String
    let createdAt: String?
    let updatedAt: String?
    let url: String?
    let authorDetails: ReviewAuthorDetails?

    enum CodingKeys: String, CodingKey {
        case id, author, content, url
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case authorDetails = "author_details"
    }
}

struct ReviewAuthorDetails: Codable, Hashable {
    let name: String?
    let username: String?
    let avatarPath: String?
    let rating: Double?

    enum CodingKeys: String, CodingKey {
        case name, username, rating
        case avatarPath = "avatar_path"
    }
}
