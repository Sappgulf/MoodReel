import SwiftUI

struct RootView: View {
    @State private var hasAPIKey = APIKeyStore.shared.isSet

    var body: some View {
        Group {
            if hasAPIKey {
                MainTabView()
            } else {
                APIKeyEntryView { key in
                    APIKeyStore.shared.apiKey = key
                    hasAPIKey = APIKeyStore.shared.isSet
                }
            }
        }
        .onAppear {
            hasAPIKey = APIKeyStore.shared.isSet
        }
        .background(Color.bgPrimary.ignoresSafeArea())
    }
}
