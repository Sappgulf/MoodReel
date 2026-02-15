import Foundation
import Security

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
    private let account = "moodreel-tmdb-api-key"
    private let service = "com.moodreel.app.securekey"

    private init() {
        // Keep the operational key in Keychain when possible.
        if readKeychainKey() == nil, let embedded = EmbeddedTMDBKey.decode() {
            _ = writeKeychainKey(embedded)
        }
    }

    var apiKey: String {
        get {
            if let custom = readKeychainKey(), !custom.isEmpty {
                return custom
            }
            return EmbeddedTMDBKey.decode() ?? ""
        }
        set {
            let trimmed = newValue.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty {
                _ = deleteKeychainKey()
            } else {
                _ = writeKeychainKey(trimmed)
            }
        }
    }

    var isSet: Bool { !apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    var isUsingEmbeddedKey: Bool { readKeychainKey() == nil }
    var maskedKey: String {
        let current = apiKey
        guard current.count > 8 else { return "••••••••" }
        let suffix = current.suffix(4)
        return "••••••••••••••••••••••••••••\(suffix)"
    }

    func addAPIKey(to params: [String: String]) -> [String: String] {
        var p = params
        p["api_key"] = apiKey
        return p
    }

    private func readKeychainKey() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess,
              let data = item as? Data,
              let value = String(data: data, encoding: .utf8),
              !value.isEmpty else {
            return nil
        }
        return value
    }

    @discardableResult
    private func writeKeychainKey(_ key: String) -> Bool {
        let data = Data(key.utf8)
        let attributes: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
        return SecItemAdd(attributes as CFDictionary, nil) == errSecSuccess
    }

    @discardableResult
    private func deleteKeychainKey() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
}

private enum EmbeddedTMDBKey {
    // XOR-obfuscated key bytes; decrypted at runtime.
    static let payload: [UInt8] = [
        43, 93, 13, 85, 51, 86, 80, 95,
        34, 15, 69, 89, 6, 17, 41, 93,
        88, 83, 97, 83, 6, 94, 115, 80,
        22, 95, 0, 19, 125, 12, 14, 82
    ]

    static let salt = Array("MoodReelCipher".utf8)

    static func decode() -> String? {
        guard !payload.isEmpty, !salt.isEmpty else { return nil }
        let decoded = payload.enumerated().map { index, value in
            value ^ salt[index % salt.count]
        }
        return String(bytes: decoded, encoding: .utf8)
    }
}
