import Foundation

// MARK: - Vibe Share Payload
//
// Mirrors the web's `useCustomPlaylists.shareableVibeUrl` schema. The web
// produces this payload, JSON-stringifies it, and URL-safe-base64 encodes it
// before sticking it in a `<origin>/shared?data=<encoded>` URL. iOS only ever
// produces the URL (the in-app share target is the system clipboard; opening
// the URL is handled by the web SharedList page in a browser).

struct VibeSharePayload: Codable {
    let type: String
    let name: String
    let v: Int
    let filters: VibeShareFilters
}

struct VibeShareFilters: Codable {
    let mood: String
    let contentType: String
    let selectedGenres: [Int]
    let selectedProviders: [Int]
    let minRating: Double
    let advancedFilters: [String: VibeShareAdvancedValue]
}

// MARK: - Advanced Filter Value
//
// `advancedFilters` is a free-form JSON object on the web. We use a small
// `Codable` wrapper that round-trips the common JSON scalar shapes. The web
// currently always passes `{}`, so the default empty case is what most builds
// need; this exists so future iOS-driven payloads can round-trip richer data
// without breaking the encoder.

enum VibeShareAdvancedValue: Codable, Equatable {
    case null
    case bool(Bool)
    case int(Int)
    case double(Double)
    case string(String)
    case array([VibeShareAdvancedValue])
    case object([String: VibeShareAdvancedValue])

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let bool = try? container.decode(Bool.self) {
            self = .bool(bool)
        } else if let int = try? container.decode(Int.self) {
            self = .int(int)
        } else if let double = try? container.decode(Double.self) {
            self = .double(double)
        } else if let string = try? container.decode(String.self) {
            self = .string(string)
        } else if let array = try? container.decode([VibeShareAdvancedValue].self) {
            self = .array(array)
        } else if let object = try? container.decode([String: VibeShareAdvancedValue].self) {
            self = .object(object)
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Unsupported advancedFilters value"
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .null:
            try container.encodeNil()
        case .bool(let value):
            try container.encode(value)
        case .int(let value):
            try container.encode(value)
        case .double(let value):
            try container.encode(value)
        case .string(let value):
            try container.encode(value)
        case .array(let value):
            try container.encode(value)
        case .object(let value):
            try container.encode(value)
        }
    }
}

// MARK: - Encoder

enum VibeShareEncoder {
    static let shareHost = "https://moodreel.app"
    static let sharePath = "/shared"

    static func buildShareURL(
        name: String,
        mood: MoodType,
        contentFilter: DiscoverViewModel.ContentFilter,
        minRating: Double,
        serviceIds: [Int]
    ) -> String? {
        let payload = VibeSharePayload(
            type: "vibe",
            name: name,
            v: 1,
            filters: VibeShareFilters(
                mood: mood.rawValue,
                contentType: webContentType(for: contentFilter),
                selectedGenres: [],
                selectedProviders: serviceIds,
                minRating: minRating,
                advancedFilters: [:]
            )
        )

        guard let encoded = encode(payload) else { return nil }
        return "\(shareHost)\(sharePath)?data=\(encoded)"
    }

    static func encode(_ payload: VibeSharePayload) -> String? {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        guard let data = try? encoder.encode(payload) else { return nil }
        return urlSafeBase64(data)
    }

    static func urlSafeBase64(_ data: Data) -> String {
        data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .trimmingCharacters(in: CharacterSet(charactersIn: "="))
    }

    private static func webContentType(for filter: DiscoverViewModel.ContentFilter) -> String {
        switch filter {
        case .all: return "all"
        case .movies: return "movies"
        case .tvShows: return "tv"
        }
    }
}
