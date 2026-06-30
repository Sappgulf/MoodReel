import SwiftUI

// MARK: - Confidence Label

struct ConfidenceLabel: Equatable {
    enum Tier: Equatable {
        case lockThisIn
        case confident
        case strong
        case roomForRisk
    }

    let tier: Tier

    var title: String {
        switch tier {
        case .lockThisIn: return "Lock this in"
        case .confident: return "Confident"
        case .strong: return "Strong"
        case .roomForRisk: return "Room for risk"
        }
    }

    var color: Color {
        switch tier {
        case .lockThisIn: return .gold
        case .confident: return .success
        case .strong: return .amber
        case .roomForRisk: return .textMuted
        }
    }

    var accessibilityLabel: String {
        "Confidence: \(title)"
    }

    static func formatConfidenceLabel(score: Double) -> String {
        guard score.isFinite else { return "Review score" }
        if score >= 92 { return "Lock this in" }
        if score >= 85 { return "Confident" }
        if score >= 78 { return "Strong" }
        return "Room for risk"
    }

    static func label(for confidence: Int) -> ConfidenceLabel {
        let tier: Tier
        switch confidence {
        case 92...:
            tier = .lockThisIn
        case 85...91:
            tier = .confident
        case 78...84:
            tier = .strong
        default:
            tier = .roomForRisk
        }
        return ConfidenceLabel(tier: tier)
    }
}
