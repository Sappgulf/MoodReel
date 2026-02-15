import SwiftUI

struct APIKeyEntryView: View {
    @State private var apiKeyText = ""
    @State private var showAsPlainText = false
    let onSave: (String) -> Void

    private var trimmedKey: String {
        apiKeyText.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.bgPrimary, Color.bgSecondary],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: AppSpacing.lg) {
                Text("MoodReel")
                    .font(AppFont.displayLarge())
                    .goldText()
                    .glowEffect(color: .gold, radius: 10, opacity: 0.35)

                Text("Add your TMDB API key to start discovering films by mood.")
                    .font(AppFont.body())
                    .foregroundStyle(Color.textSecondary)
                    .multilineTextAlignment(.center)

                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    Text("TMDB API KEY")
                        .font(AppFont.label())
                        .foregroundStyle(Color.textMuted)

                    Group {
                        if showAsPlainText {
                            TextField("Paste key here", text: $apiKeyText)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        } else {
                            SecureField("Paste key here", text: $apiKeyText)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        }
                    }
                    .font(AppFont.body())
                    .padding(.horizontal, AppSpacing.md)
                    .padding(.vertical, 14)
                    .background(Color.bgTertiary)
                    .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous)
                            .stroke(Color.borderDefault, lineWidth: 1)
                    )

                    Toggle("Show API key", isOn: $showAsPlainText)
                        .toggleStyle(.switch)
                        .font(AppFont.caption())
                        .foregroundStyle(Color.textSecondary)
                }

                Button {
                    onSave(trimmedKey)
                } label: {
                    Text("Continue")
                        .font(AppFont.subheadline())
                        .foregroundStyle(Color.black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(AppGradients.gold)
                        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(trimmedKey.isEmpty)
                .opacity(trimmedKey.isEmpty ? 0.5 : 1)

                Link("Get a free TMDB API key", destination: URL(string: "https://www.themoviedb.org/settings/api")!)
                    .font(AppFont.caption())
                    .foregroundStyle(Color.goldLight)
                    .padding(.top, AppSpacing.sm)
            }
            .padding(AppSpacing.lg)
            .glassCard(cornerRadius: AppRadius.xl, backgroundOpacity: 1)
            .padding(AppSpacing.lg)
        }
    }
}
