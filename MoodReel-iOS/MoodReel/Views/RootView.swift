import SwiftUI

struct RootView: View {
    @State private var apiKey: String = APIKeyStore.shared.apiKey

    private var hasAPIKey: Bool {
        !apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        Group {
            if hasAPIKey {
                MainTabView {
                    APIKeyStore.shared.apiKey = ""
                    apiKey = ""
                }
            } else {
                APIKeyEntryView { key in
                    APIKeyStore.shared.apiKey = key
                    apiKey = key
                }
            }
        }
        .background(Color.bgPrimary.ignoresSafeArea())
    }
}
