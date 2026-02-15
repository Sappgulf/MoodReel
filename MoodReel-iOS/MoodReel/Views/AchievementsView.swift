import SwiftUI

struct AchievementsView: View {
    @EnvironmentObject private var watchlistStore: WatchlistStore
    @EnvironmentObject private var discoverViewModel: DiscoverViewModel

    private let calendar = Calendar.current

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color.bgPrimary, Color.bgSecondary],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                        summaryHeader

                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: AppSpacing.sm) {
                            ForEach(evaluatedAchievements) { achievement in
                                AchievementCardView(achievement: achievement)
                            }
                        }
                    }
                    .padding(AppSpacing.md)
                }
            }
            .navigationTitle("Achievements")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var evaluatedAchievements: [EvaluatedAchievement] {
        AchievementType.allCases
            .map(evaluate)
            .sorted {
                if $0.isUnlocked != $1.isUnlocked {
                    return $0.isUnlocked && !$1.isUnlocked
                }
                if $0.progress != $1.progress {
                    return $0.progress > $1.progress
                }
                return $0.type.displayName < $1.type.displayName
            }
    }

    private var summaryHeader: some View {
        let unlocked = evaluatedAchievements.filter(\.isUnlocked)
        let points = unlocked.reduce(0) { $0 + $1.type.points }

        return HStack(spacing: AppSpacing.sm) {
            summaryPill(title: "Unlocked", value: "\(unlocked.count)/\(AchievementType.allCases.count)")
            summaryPill(title: "Points", value: "\(points)")
            summaryPill(title: "Mood Types", value: "\(discoverViewModel.distinctMoodsUsed)/12")
        }
    }

    private func summaryPill(title: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(AppFont.subheadline())
                .foregroundStyle(Color.gold)
            Text(title)
                .font(AppFont.caption())
                .foregroundStyle(Color.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color.bgTertiary)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.md, style: .continuous))
    }

    private func evaluate(_ type: AchievementType) -> EvaluatedAchievement {
        let savedCount = watchlistStore.items.count
        let watchedCount = watchlistStore.watchedItems.count
        let ratedCount = watchlistStore.items.filter { $0.userRating != nil }.count
        let distinctMoods = discoverViewModel.distinctMoodsUsed
        let moodEntries = discoverViewModel.moodHistory

        let progress: Double
        switch type {
        case .firstWatch:
            progress = progressValue(watchedCount, target: 1)
        case .watchlistTen:
            progress = progressValue(savedCount, target: 10)
        case .watchlistFifty:
            progress = progressValue(savedCount, target: 50)
        case .watchlistHundred:
            progress = progressValue(watchedCount, target: 100)
        case .watchlistFiveHundred:
            progress = progressValue(watchedCount, target: 500)
        case .moodExplorer:
            progress = progressValue(distinctMoods, target: 5)
        case .moodMaster, .allMoodsUnlocked:
            progress = progressValue(distinctMoods, target: 12)
        case .moodStreak:
            progress = progressValue(currentMoodStreak(), target: 7)
        case .firstRating:
            progress = progressValue(ratedCount, target: 1)
        case .tenRatings:
            progress = progressValue(ratedCount, target: 10)
        case .fiftyRatings:
            progress = progressValue(ratedCount, target: 50)
        case .genreHopper:
            progress = progressValue(distinctMoods, target: 8)
        case .worldCinema:
            progress = progressValue(distinctMoods, target: 5)
        case .classicCinema:
            progress = hasClassicFilm() ? 1 : 0
        case .modernCinema:
            progress = progressValue(modernTitlesCount(), target: 10)
        case .weekStreak:
            progress = progressValue(currentMoodStreak(), target: 7)
        case .monthStreak:
            progress = progressValue(currentMoodStreak(), target: 30)
        case .nightOwl:
            progress = moodEntries.contains(where: { calendar.component(.hour, from: $0.date) >= 0 && calendar.component(.hour, from: $0.date) < 5 }) ? 1 : 0
        case .earlyBird:
            progress = moodEntries.contains(where: { calendar.component(.hour, from: $0.date) < 7 }) ? 1 : 0
        case .bingeWatcher:
            progress = maxWatchedInSingleDay() >= 5 ? 1 : 0
        }

        return EvaluatedAchievement(type: type, progress: progress, isUnlocked: progress >= 1)
    }

    private func progressValue(_ value: Int, target: Int) -> Double {
        guard target > 0 else { return 0 }
        return min(1, Double(value) / Double(target))
    }

    private func hasClassicFilm() -> Bool {
        watchlistStore.watchedItems.contains { item in
            guard let yearText = item.releaseYear, let year = Int(yearText) else { return false }
            return year < 1980
        }
    }

    private func modernTitlesCount() -> Int {
        let currentYear = calendar.component(.year, from: Date())
        return watchlistStore.watchedItems.filter { item in
            guard let yearText = item.releaseYear, let year = Int(yearText) else { return false }
            return year >= currentYear - 2
        }.count
    }

    private func currentMoodStreak() -> Int {
        let days = Set(discoverViewModel.moodHistory.map { calendar.startOfDay(for: $0.date) })
        let sortedDays = days.sorted(by: >)
        guard let first = sortedDays.first else { return 0 }

        var streak = 1
        var cursor = first
        while let previous = calendar.date(byAdding: .day, value: -1, to: cursor), days.contains(previous) {
            streak += 1
            cursor = previous
        }
        return streak
    }

    private func maxWatchedInSingleDay() -> Int {
        let watchedDates = watchlistStore.watchedItems.compactMap(\.watchedDate).map { calendar.startOfDay(for: $0) }
        let grouped = Dictionary(grouping: watchedDates, by: { $0 })
        return grouped.values.map(\.count).max() ?? 0
    }
}

private struct EvaluatedAchievement: Identifiable {
    var id: AchievementType { type }
    let type: AchievementType
    let progress: Double
    let isUnlocked: Bool
}

private struct AchievementCardView: View {
    let achievement: EvaluatedAchievement

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            HStack {
                Text(achievement.type.emoji)
                    .font(.system(size: 20))

                Spacer()

                Text(achievement.type.rarity.displayName)
                    .font(AppFont.captionSmall())
                    .foregroundStyle(achievement.type.rarity.color)
            }

            Text(achievement.type.displayName)
                .font(AppFont.subheadline())
                .foregroundStyle(Color.textPrimary)
                .lineLimit(2)

            Text(achievement.type.description)
                .font(AppFont.caption())
                .foregroundStyle(Color.textSecondary)
                .lineLimit(3)

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.bgTertiary)
                    Capsule()
                        .fill(achievement.type.rarity.gradient)
                        .frame(width: geo.size.width * achievement.progress)
                }
            }
            .frame(height: 8)

            HStack {
                Text(achievement.isUnlocked ? "Unlocked" : "\(Int(achievement.progress * 100))%")
                    .font(AppFont.captionSmall())
                    .foregroundStyle(achievement.isUnlocked ? Color.success : Color.textMuted)

                Spacer()

                Text("+\(achievement.type.points)")
                    .font(AppFont.captionSmall())
                    .foregroundStyle(Color.gold)
            }
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
        .goldBorder(cornerRadius: AppRadius.lg, opacity: achievement.isUnlocked ? 0.45 : 0.15)
    }
}
