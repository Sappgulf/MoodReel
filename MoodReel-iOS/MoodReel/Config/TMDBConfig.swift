import Foundation

// MARK: - TMDB Configuration

struct TMDBConfig {
    static let baseURL = "https://api.themoviedb.org/3"
    static let imageBaseURL = "https://image.tmdb.org/t/p/"

    enum ImageSize: String {
        case w92, w154, w185, w342, w500, w780, original
    }

    static func imageURL(_ path: String?, size: ImageSize = .w500) -> URL? {
        guard let path else { return nil }
        return URL(string: "\(imageBaseURL)\(size.rawValue)\(path)")
    }

    static func backdropURL(_ path: String?) -> URL? {
        imageURL(path, size: .w780)
    }

    static func posterURL(_ path: String?) -> URL? {
        imageURL(path, size: .w500)
    }

    static func thumbnailURL(_ path: String?) -> URL? {
        imageURL(path, size: .w185)
    }

    static func buildURL(_ endpoint: String, params: [String: String] = [:]) -> URL? {
        var components = URLComponents(string: "\(baseURL)\(endpoint)")
        var queryItems = params.map { URLQueryItem(name: $0.key, value: $0.value) }
        queryItems.append(URLQueryItem(name: "language", value: "en-US"))
        components?.queryItems = queryItems
        return components?.url
    }
}

// MARK: - API Key Storage

final class APIKeyStore {
    static let shared = APIKeyStore()
    private let key = "moodreel-tmdb-api-key"
    private init() {}

    var apiKey: String {
        get { UserDefaults.standard.string(forKey: key) ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: key) }
    }

    var isSet: Bool { !apiKey.trimmingCharacters(in: .whitespaces).isEmpty }

    func addAPIKey(to params: [String: String]) -> [String: String] {
        var p = params
        p["api_key"] = apiKey
        return p
    }
}
