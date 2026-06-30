import Foundation
import Testing
@testable import MoodReel

@Suite("TonightPick")
struct TonightPickTests {
    private func makeItem() -> MediaResult {
        .movie(
            Movie(
                id: 27205,
                title: "Inception",
                originalTitle: "Inception",
                overview: "A thief who steals corporate secrets through dream-sharing technology.",
                posterPath: nil,
                backdropPath: nil,
                voteAverage: 8.4,
                voteCount: 1000,
                releaseDate: "2010-07-15",
                genreIds: [28, 878],
                popularity: 120,
                adult: nil,
                originalLanguage: "en",
                video: nil,
                mediaType: .movie
            )
        )
    }

    @Test("Initializes with the supplied fields")
    func initializesWithSuppliedFields() {
        let item = makeItem()
        let pick = TonightViewModel.TonightPick(
            id: "best-27205-movie",
            slot: .best,
            item: item,
            confidence: 92,
            reason: "Best Match: matches relaxed.",
            reasons: ["matches relaxed", "works for friends viewing"],
            caveat: nil
        )

        #expect(pick.id == "best-27205-movie")
        #expect(pick.slot == .best)
        #expect(pick.item.id == 27205)
        #expect(pick.confidence == 92)
        #expect(pick.reason == "Best Match: matches relaxed.")
        #expect(pick.reasons == ["matches relaxed", "works for friends viewing"])
        #expect(pick.caveat == nil)
    }

    @Test("slotTitle returns the slot's display name")
    func slotTitleReturnsDisplayName() {
        let pick = TonightViewModel.TonightPick(
            id: "safe-1-movie",
            slot: .safe,
            item: makeItem(),
            confidence: 80,
            reason: "Safe Bet: strong ratings.",
            reasons: [],
            caveat: nil
        )

        #expect(pick.slotTitle == "Safe Bet")
    }

    @Test("confidenceLabel maps a 92 to Lock this in")
    func confidenceLabelAt92IsLockThisIn() {
        let pick = TonightViewModel.TonightPick(
            id: "best-1-movie",
            slot: .best,
            item: makeItem(),
            confidence: 92,
            reason: "Best Match: top pick.",
            reasons: ["matches relaxed"],
            caveat: nil
        )

        #expect(pick.confidenceLabel.tier == .lockThisIn)
        #expect(pick.confidenceLabel.title == "Lock this in")
    }

    @Test("confidenceLabel maps a 78 to Strong")
    func confidenceLabelAt78IsStrong() {
        let pick = TonightViewModel.TonightPick(
            id: "wild-1-movie",
            slot: .wild,
            item: makeItem(),
            confidence: 78,
            reason: "Wild Card: strong fit.",
            reasons: [],
            caveat: nil
        )

        #expect(pick.confidenceLabel.tier == .strong)
    }

    @Test("confidenceLabel maps a 77 to Room for risk")
    func confidenceLabelAt77IsRoomForRisk() {
        let pick = TonightViewModel.TonightPick(
            id: "wild-1-movie",
            slot: .wild,
            item: makeItem(),
            confidence: 77,
            reason: "Wild Card: uncertain.",
            reasons: [],
            caveat: nil
        )

        #expect(pick.confidenceLabel.tier == .roomForRisk)
    }

    @Test("accessibilitySummary is non-empty when reasons are present")
    func accessibilitySummaryIsNonEmptyWithReasons() {
        let pick = TonightViewModel.TonightPick(
            id: "best-1-movie",
            slot: .best,
            item: makeItem(),
            confidence: 90,
            reason: "Best Match: matches relaxed, works for friends viewing.",
            reasons: ["matches relaxed", "works for friends viewing"],
            caveat: "less proven for safe mode"
        )

        let summary = pick.accessibilitySummary
        #expect(!summary.isEmpty)
        #expect(summary.contains("Inception"))
        #expect(summary.contains("90"))
        #expect(summary.contains("matches relaxed"))
    }

    @Test("accessibilitySummary remains non-empty when reasons are empty")
    func accessibilitySummaryIsNonEmptyWithoutReasons() {
        let pick = TonightViewModel.TonightPick(
            id: "best-1-movie",
            slot: .best,
            item: makeItem(),
            confidence: 88,
            reason: "Best Match: top pick.",
            reasons: [],
            caveat: nil
        )

        #expect(!pick.accessibilitySummary.isEmpty)
    }

    @Test("formatConfidenceLabel static helper matches the tier boundaries")
    func staticFormatConfidenceLabelMatchesTiers() {
        #expect(TonightViewModel.TonightPick.formatConfidenceLabel(score: 95) == "Lock this in")
        #expect(TonightViewModel.TonightPick.formatConfidenceLabel(score: 60) == "Room for risk")
    }
}
