import SwiftUI

// MARK: - Cinema Noir Design System

extension Color {
    // Backgrounds
    static let bgPrimary = Color(hex: "#09090b")
    static let bgSecondary = Color(hex: "#0f0f12")
    static let bgTertiary = Color(hex: "#18181b")
    static let bgCard = Color.white.opacity(0.02)
    static let bgGlass = Color.white.opacity(0.04)
    static let bgGlassHover = Color.white.opacity(0.08)
    static let bgElevated = Color.white.opacity(0.06)
    static let bgElevated2 = Color.white.opacity(0.10)

    // Accents
    static let gold = Color(hex: "#ffd700")
    static let goldLight = Color(hex: "#ffe55c")
    static let amber = Color(hex: "#f5a623")
    static let amberDark = Color(hex: "#c78b1a")
    static let crimson = Color(hex: "#dc143c")
    static let crimsonDark = Color(hex: "#8b0a1c")

    // Text
    static let textPrimary = Color(hex: "#fafafa")
    static let textSecondary = Color(hex: "#a1a1aa")
    static let textMuted = Color(hex: "#71717a")

    // Borders
    static let borderSubtle = Color.white.opacity(0.06)
    static let borderDefault = Color.white.opacity(0.10)
    static let borderStrong = Color.white.opacity(0.14)
    static let borderGold = Color(hex: "#ffd700").opacity(0.5)

    // Status
    static let success = Color(hex: "#22c55e")
    static let warning = Color(hex: "#ffd700")
    static let error = Color(hex: "#ef4444")

    // Gradient helpers
    static let gradientGoldStart = Color(hex: "#ffd700")
    static let gradientGoldEnd = Color(hex: "#c78b1a")

    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 255, 255, 255)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Gradient Presets

struct AppGradients {
    static let gold = LinearGradient(
        colors: [.gradientGoldStart, .amber, .gradientGoldEnd],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    static let goldSoft = LinearGradient(
        colors: [
            Color(hex: "#ffd700").opacity(0.9),
            Color(hex: "#f5a623").opacity(0.7),
            Color(hex: "#c78b1a").opacity(0.5)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    static let crimson = LinearGradient(
        colors: [.crimson, .crimsonDark],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    static let cardOverlay = LinearGradient(
        colors: [.clear, Color.black.opacity(0.8)],
        startPoint: .top,
        endPoint: .bottom
    )
    static let shimmer = LinearGradient(
        colors: [
            Color.white.opacity(0.04),
            Color.white.opacity(0.10),
            Color.white.opacity(0.04)
        ],
        startPoint: .leading,
        endPoint: .trailing
    )
    static let radialGold = RadialGradient(
        colors: [Color(hex: "#ffd700").opacity(0.15), .clear],
        center: .center,
        startRadius: 0,
        endRadius: 200
    )
    static let heroOverlay = LinearGradient(
        colors: [
            Color.black.opacity(0.0),
            Color.black.opacity(0.3),
            Color(hex: "#09090b").opacity(0.95)
        ],
        startPoint: .top,
        endPoint: .bottom
    )
}

// MARK: - Typography

struct AppFont {
    static func displayLarge(_ size: CGFloat = 32) -> Font {
        .custom("Georgia-Bold", size: size)
    }
    static func display(_ size: CGFloat = 24) -> Font {
        .custom("Georgia", size: size)
    }
    static func headline(_ size: CGFloat = 18) -> Font {
        .system(size: size, weight: .semibold, design: .default)
    }
    static func subheadline(_ size: CGFloat = 15) -> Font {
        .system(size: size, weight: .medium, design: .default)
    }
    static func body(_ size: CGFloat = 15) -> Font {
        .system(size: size, weight: .regular, design: .default)
    }
    static func caption(_ size: CGFloat = 12) -> Font {
        .system(size: size, weight: .medium, design: .default)
    }
    static func captionSmall(_ size: CGFloat = 10) -> Font {
        .system(size: size, weight: .semibold, design: .default)
    }
    static func mono(_ size: CGFloat = 13) -> Font {
        .system(size: size, weight: .medium, design: .monospaced)
    }
    static func label(_ size: CGFloat = 11) -> Font {
        .system(size: size, weight: .bold, design: .default)
    }
}

// MARK: - Spacing

struct AppSpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
    static let xxxl: CGFloat = 64
}

// MARK: - Corner Radius

struct AppRadius {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 20
    static let xxl: CGFloat = 28
    static let full: CGFloat = 999
}

// MARK: - Shadow Presets

struct AppShadow {
    static func gold(radius: CGFloat = 20, opacity: Double = 0.4) -> some View {
        EmptyView()
            .shadow(color: Color.gold.opacity(opacity), radius: radius, x: 0, y: 4)
    }

    static let cardShadow = Shadow(
        color: Color.black.opacity(0.5),
        radius: 24,
        x: 0,
        y: 8
    )
    static let goldGlow = Shadow(
        color: Color.gold.opacity(0.3),
        radius: 20,
        x: 0,
        y: 0
    )
    static let crimsonGlow = Shadow(
        color: Color.crimson.opacity(0.4),
        radius: 16,
        x: 0,
        y: 0
    )

    struct Shadow {
        let color: Color
        let radius: CGFloat
        let x: CGFloat
        let y: CGFloat
    }
}

// MARK: - Animation Presets

struct AppAnimation {
    static let snappy = Animation.spring(response: 0.3, dampingFraction: 0.7)
    static let smooth = Animation.spring(response: 0.5, dampingFraction: 0.8)
    static let bouncy = Animation.spring(response: 0.4, dampingFraction: 0.6)
    static let gentle = Animation.easeInOut(duration: 0.4)
    static let quick = Animation.easeOut(duration: 0.2)
    static let shimmerRepeat = Animation.linear(duration: 1.5).repeatForever(autoreverses: false)
    static let pulseRepeat = Animation.easeInOut(duration: 1.8).repeatForever(autoreverses: true)
}
