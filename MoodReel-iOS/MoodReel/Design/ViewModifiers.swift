import SwiftUI

// MARK: - Glass Card Modifier

struct GlassCardModifier: ViewModifier {
    var cornerRadius: CGFloat
    var borderOpacity: Double
    var backgroundOpacity: Double
    var hasShadow: Bool

    init(
        cornerRadius: CGFloat = AppRadius.lg,
        borderOpacity: Double = 1.0,
        backgroundOpacity: Double = 1.0,
        hasShadow: Bool = true
    ) {
        self.cornerRadius = cornerRadius
        self.borderOpacity = borderOpacity
        self.backgroundOpacity = backgroundOpacity
        self.hasShadow = hasShadow
    }

    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Color.bgGlass.opacity(backgroundOpacity))
                    .background(
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .fill(.ultraThinMaterial)
                            .opacity(0.5)
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.12 * borderOpacity),
                                Color.white.opacity(0.04 * borderOpacity)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 0.5
                    )
            )
            .if(hasShadow) { view in
                view.shadow(
                    color: Color.black.opacity(0.4),
                    radius: 20,
                    x: 0,
                    y: 8
                )
            }
    }
}

// MARK: - Gold Border Modifier

struct GoldBorderModifier: ViewModifier {
    var cornerRadius: CGFloat
    var lineWidth: CGFloat
    var opacity: Double
    var animated: Bool
    @State private var shimmerOffset: CGFloat = -1

    init(
        cornerRadius: CGFloat = AppRadius.lg,
        lineWidth: CGFloat = 1.0,
        opacity: Double = 0.6,
        animated: Bool = false
    ) {
        self.cornerRadius = cornerRadius
        self.lineWidth = lineWidth
        self.opacity = opacity
        self.animated = animated
    }

    func body(content: Content) -> some View {
        content
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(
                        LinearGradient(
                            colors: animated
                                ? [
                                    Color.gold.opacity(opacity * 0.4),
                                    Color.gold.opacity(opacity),
                                    Color.goldLight.opacity(opacity * 0.8),
                                    Color.gold.opacity(opacity * 0.4)
                                ]
                                : [
                                    Color.gold.opacity(opacity),
                                    Color.amber.opacity(opacity * 0.6)
                                ],
                            startPoint: animated
                                ? UnitPoint(x: shimmerOffset, y: 0)
                                : .topLeading,
                            endPoint: animated
                                ? UnitPoint(x: shimmerOffset + 1, y: 1)
                                : .bottomTrailing
                        ),
                        lineWidth: lineWidth
                    )
            )
            .onAppear {
                if animated {
                    withAnimation(AppAnimation.shimmerRepeat) {
                        shimmerOffset = 1
                    }
                }
            }
    }
}

// MARK: - Shimmer Effect Modifier

struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = -1
    var isActive: Bool

    init(isActive: Bool = true) {
        self.isActive = isActive
    }

    func body(content: Content) -> some View {
        content
            .overlay(
                Group {
                    if isActive {
                        GeometryReader { geometry in
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.0),
                                    Color.white.opacity(0.12),
                                    Color.white.opacity(0.0)
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                            .frame(width: geometry.size.width * 0.5)
                            .offset(x: phase * (geometry.size.width + geometry.size.width * 0.5))
                        }
                        .mask(content)
                    }
                }
            )
            .onAppear {
                if isActive {
                    withAnimation(AppAnimation.shimmerRepeat) {
                        phase = 1.5
                    }
                }
            }
    }
}

// MARK: - Press Effect Modifier

struct PressEffectModifier: ViewModifier {
    var scale: CGFloat
    var opacity: Double
    @GestureState private var isPressed = false

    init(scale: CGFloat = 0.96, opacity: Double = 0.85) {
        self.scale = scale
        self.opacity = opacity
    }

    func body(content: Content) -> some View {
        content
            .scaleEffect(isPressed ? scale : 1.0)
            .opacity(isPressed ? opacity : 1.0)
            .animation(AppAnimation.snappy, value: isPressed)
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .updating($isPressed) { _, state, _ in
                        state = true
                    }
            )
    }
}

// MARK: - Glow Effect Modifier

struct GlowModifier: ViewModifier {
    var color: Color
    var radius: CGFloat
    var opacity: Double
    var animated: Bool
    @State private var pulse: Bool = false

    init(
        color: Color = .gold,
        radius: CGFloat = 16,
        opacity: Double = 0.5,
        animated: Bool = false
    ) {
        self.color = color
        self.radius = radius
        self.opacity = opacity
        self.animated = animated
    }

    func body(content: Content) -> some View {
        content
            .shadow(
                color: color.opacity(animated ? (pulse ? opacity : opacity * 0.4) : opacity),
                radius: animated ? (pulse ? radius : radius * 0.5) : radius,
                x: 0,
                y: 0
            )
            .onAppear {
                if animated {
                    withAnimation(AppAnimation.pulseRepeat) {
                        pulse = true
                    }
                }
            }
    }
}

// MARK: - Skeleton Loading Modifier

struct SkeletonModifier: ViewModifier {
    @State private var shimmerOffset: CGFloat = -1
    var isLoading: Bool
    var cornerRadius: CGFloat

    init(isLoading: Bool = true, cornerRadius: CGFloat = AppRadius.md) {
        self.isLoading = isLoading
        self.cornerRadius = cornerRadius
    }

    func body(content: Content) -> some View {
        if isLoading {
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(Color.bgTertiary)
                .overlay(
                    GeometryReader { geometry in
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.0),
                                Color.white.opacity(0.06),
                                Color.white.opacity(0.0)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                        .frame(width: geometry.size.width)
                        .offset(x: shimmerOffset * geometry.size.width)
                    }
                )
                .onAppear {
                    withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: false)) {
                        shimmerOffset = 2
                    }
                }
        } else {
            content
        }
    }
}

// MARK: - Floating Card Modifier

struct FloatingCardModifier: ViewModifier {
    @State private var floatOffset: CGFloat = 0
    var amplitude: CGFloat
    var duration: Double

    init(amplitude: CGFloat = 6, duration: Double = 3.0) {
        self.amplitude = amplitude
        self.duration = duration
    }

    func body(content: Content) -> some View {
        content
            .offset(y: floatOffset)
            .onAppear {
                withAnimation(
                    .easeInOut(duration: duration)
                    .repeatForever(autoreverses: true)
                ) {
                    floatOffset = amplitude
                }
            }
    }
}

// MARK: - Haptic Feedback Modifier

struct HapticModifier: ViewModifier {
    var style: UIImpactFeedbackGenerator.FeedbackStyle

    func body(content: Content) -> some View {
        content.onTapGesture {
            UIImpactFeedbackGenerator(style: style).impactOccurred()
        }
    }
}

// MARK: - Conditional Modifier

extension View {
    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }

    @ViewBuilder
    func ifLet<T, Content: View>(_ value: T?, transform: (Self, T) -> Content) -> some View {
        if let value = value {
            transform(self, value)
        } else {
            self
        }
    }
}

// MARK: - View Extension Shortcuts

extension View {
    func glassCard(
        cornerRadius: CGFloat = AppRadius.lg,
        borderOpacity: Double = 1.0,
        backgroundOpacity: Double = 1.0,
        hasShadow: Bool = true
    ) -> some View {
        modifier(GlassCardModifier(
            cornerRadius: cornerRadius,
            borderOpacity: borderOpacity,
            backgroundOpacity: backgroundOpacity,
            hasShadow: hasShadow
        ))
    }

    func goldBorder(
        cornerRadius: CGFloat = AppRadius.lg,
        lineWidth: CGFloat = 1.0,
        opacity: Double = 0.6,
        animated: Bool = false
    ) -> some View {
        modifier(GoldBorderModifier(
            cornerRadius: cornerRadius,
            lineWidth: lineWidth,
            opacity: opacity,
            animated: animated
        ))
    }

    func shimmerEffect(isActive: Bool = true) -> some View {
        modifier(ShimmerModifier(isActive: isActive))
    }

    func pressEffect(scale: CGFloat = 0.96, opacity: Double = 0.85) -> some View {
        modifier(PressEffectModifier(scale: scale, opacity: opacity))
    }

    func glowEffect(
        color: Color = .gold,
        radius: CGFloat = 16,
        opacity: Double = 0.5,
        animated: Bool = false
    ) -> some View {
        modifier(GlowModifier(
            color: color,
            radius: radius,
            opacity: opacity,
            animated: animated
        ))
    }

    func skeleton(isLoading: Bool = true, cornerRadius: CGFloat = AppRadius.md) -> some View {
        modifier(SkeletonModifier(isLoading: isLoading, cornerRadius: cornerRadius))
    }

    func floatingCard(amplitude: CGFloat = 6, duration: Double = 3.0) -> some View {
        modifier(FloatingCardModifier(amplitude: amplitude, duration: duration))
    }

    func hapticFeedback(style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) -> some View {
        modifier(HapticModifier(style: style))
    }
}

// MARK: - Reveal on Scroll Modifier

struct RevealModifier: ViewModifier {
    var delay: Double
    @State private var appeared = false

    init(delay: Double = 0) {
        self.delay = delay
    }

    func body(content: Content) -> some View {
        content
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 20)
            .onAppear {
                withAnimation(AppAnimation.smooth.delay(delay)) {
                    appeared = true
                }
            }
    }
}

extension View {
    func revealOnAppear(delay: Double = 0) -> some View {
        modifier(RevealModifier(delay: delay))
    }
}

// MARK: - Cinema Stripe Overlay

struct CinemaStripeModifier: ViewModifier {
    var opacity: Double

    init(opacity: Double = 0.03) {
        self.opacity = opacity
    }

    func body(content: Content) -> some View {
        content
            .overlay(
                VStack(spacing: 0) {
                    ForEach(0..<40, id: \.self) { _ in
                        Rectangle()
                            .fill(Color.white.opacity(opacity))
                            .frame(height: 1)
                        Rectangle()
                            .fill(Color.clear)
                            .frame(height: 3)
                    }
                }
                .allowsHitTesting(false)
            )
    }
}

extension View {
    func cinemaStripes(opacity: Double = 0.03) -> some View {
        modifier(CinemaStripeModifier(opacity: opacity))
    }
}

// MARK: - Noise Texture Modifier

struct NoiseTextureModifier: ViewModifier {
    var opacity: Double

    func body(content: Content) -> some View {
        content
            .overlay(
                Canvas { context, size in
                    var rng = SystemRandomNumberGenerator()
                    for _ in 0..<Int(size.width * size.height * 0.05) {
                        let x = CGFloat(rng.next() % UInt64(size.width))
                        let y = CGFloat(rng.next() % UInt64(size.height))
                        let alpha = Double(rng.next() % 100) / 100.0 * opacity
                        context.fill(
                            Path(ellipseIn: CGRect(x: x, y: y, width: 1, height: 1)),
                            with: .color(Color.white.opacity(alpha))
                        )
                    }
                }
                .allowsHitTesting(false)
            )
    }
}

// MARK: - Tab Bar Safe Area Padding

extension View {
    func tabBarPadding() -> some View {
        padding(.bottom, 88)
    }

    func safeBottomPadding(_ extra: CGFloat = 0) -> some View {
        padding(.bottom, extra)
    }
}

// MARK: - Gold Text Modifier

struct GoldTextModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .foregroundStyle(AppGradients.gold)
    }
}

extension View {
    func goldText() -> some View {
        modifier(GoldTextModifier())
    }
}

// MARK: - Bounce on Appear

struct BounceOnAppearModifier: ViewModifier {
    var delay: Double
    @State private var appeared = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(appeared ? 1 : 0.6)
            .opacity(appeared ? 1 : 0)
            .onAppear {
                withAnimation(AppAnimation.bouncy.delay(delay)) {
                    appeared = true
                }
            }
    }
}

extension View {
    func bounceOnAppear(delay: Double = 0) -> some View {
        modifier(BounceOnAppearModifier(delay: delay))
    }
}
