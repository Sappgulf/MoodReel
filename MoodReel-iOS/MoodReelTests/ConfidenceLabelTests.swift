import Testing
@testable import MoodReel

@Suite("ConfidenceLabel")
struct ConfidenceLabelTests {
    @Test("Below all tiers falls back to room-for-risk")
    func scoreZeroReturnsRoomForRisk() {
        #expect(ConfidenceLabel.formatConfidenceLabel(score: 0) == "Room for risk")
    }

    @Test("Score just below 78 stays in room-for-risk tier")
    func score77IsRoomForRisk() {
        #expect(ConfidenceLabel.formatConfidenceLabel(score: 77) == "Room for risk")
    }

    @Test("78 is the inclusive boundary into the Strong tier")
    func score78IsStrong() {
        #expect(ConfidenceLabel.formatConfidenceLabel(score: 78) == "Strong")
    }

    @Test("Just under the 85 boundary remains Strong")
    func score84IsStrong() {
        #expect(ConfidenceLabel.formatConfidenceLabel(score: 84) == "Strong")
    }

    @Test("85 is the inclusive boundary into the Confident tier")
    func score85IsConfident() {
        #expect(ConfidenceLabel.formatConfidenceLabel(score: 85) == "Confident")
    }

    @Test("Just under the 92 boundary remains Confident")
    func score91IsConfident() {
        #expect(ConfidenceLabel.formatConfidenceLabel(score: 91) == "Confident")
    }

    @Test("92 is the inclusive boundary into the Lock this in tier")
    func score92IsLockThisIn() {
        #expect(ConfidenceLabel.formatConfidenceLabel(score: 92) == "Lock this in")
    }

    @Test("Perfect score stays in the top tier")
    func score100IsLockThisIn() {
        #expect(ConfidenceLabel.formatConfidenceLabel(score: 100) == "Lock this in")
    }

    @Test("Non-finite scores fall back to the review label")
    func nanReturnsReviewLabel() {
        let score = Double.nan
        #expect(ConfidenceLabel.formatConfidenceLabel(score: score) == "Review score")
    }

    @Test("Infinity also falls back to the review label")
    func infinityReturnsReviewLabel() {
        #expect(ConfidenceLabel.formatConfidenceLabel(score: .infinity) == "Review score")
    }

    @Test("label(for:) mirrors the same tier boundaries")
    func labelForMatchesTierBoundaries() {
        #expect(ConfidenceLabel.label(for: 50).tier == .roomForRisk)
        #expect(ConfidenceLabel.label(for: 78).tier == .strong)
        #expect(ConfidenceLabel.label(for: 85).tier == .confident)
        #expect(ConfidenceLabel.label(for: 92).tier == .lockThisIn)
    }
}
