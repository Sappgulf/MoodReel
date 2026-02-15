import SwiftUI

struct InsightsView: View {
    @EnvironmentObject private var watchlistStore: WatchlistStore
    @EnvironmentObject private var discoverViewModel: DiscoverViewModel

    private let calendar = Calendar.current

    private var averageTMDBRating: String {
        guard !watchlistStore.items.isEmpty else { return "0.0" }
        let value = watchlistStore.items.reduce(0) { $0 + $1.voteAverage } / Double(watchlistStore.items.count)
        return String(format: "%.1f", value)
    }

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
                        statsGrid
                        moodBreakdown
                        moodCalendar
                        recentSearches
                    }
                    .padding(AppSpacing.md)
                }
            }
            .navigationTitle("Insights")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var statsGrid: some View {
        HStack(spacing: AppSpacing.sm) {
            statCard(title: "Saved", value: "\(watchlistStore.items.count)", icon: "bookmark.fill")
            statCard(title: "Watched", value: "\(watchlistStore.watchedItems.count)", icon: "checkmark.circle.fill")
            statCard(title: "Avg TMDB", value: averageTMDBRating, icon: "star.fill")
        }
    }

    private func statCard(title: String, value: String, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: icon)
                .foregroundStyle(Color.gold)
            Text(value)
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)
            Text(title)
                .font(AppFont.caption())
                .foregroundStyle(Color.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
    }

    private var moodBreakdown: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("Top Moods")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            if discoverViewModel.topMoodCounts.isEmpty {
                Text("Use Discover a bit more to generate mood analytics.")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textMuted)
            } else {
                ForEach(discoverViewModel.topMoodCounts.prefix(6), id: \.0) { mood, count in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text("\(mood.emoji) \(mood.displayName)")
                                .font(AppFont.caption())
                                .foregroundStyle(Color.textPrimary)
                            Spacer()
                            Text("\(count)")
                                .font(AppFont.caption())
                                .foregroundStyle(Color.textSecondary)
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule()
                                    .fill(Color.bgTertiary)
                                Capsule()
                                    .fill(mood.gradient)
                                    .frame(width: max(8, geo.size.width * CGFloat(progress(for: count))))
                            }
                        }
                        .frame(height: 8)
                    }
                }
            }
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
    }

    private var moodCalendar: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("Mood Calendar (Last 30 Days)")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            let days = recentDays(count: 30)
            let entriesByDay = groupedMoodEntriesByDay()

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 7), spacing: 6) {
                ForEach(days, id: \.self) { day in
                    let key = calendar.startOfDay(for: day)
                    let mood = entriesByDay[key]?.last?.mood
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .fill(mood?.color ?? Color.bgTertiary)
                        .frame(height: 24)
                        .overlay(
                            Text(day.formatted(.dateTime.day()))
                                .font(AppFont.captionSmall(9))
                                .foregroundStyle(Color.textPrimary.opacity(mood == nil ? 0.5 : 0.85))
                        )
                }
            }
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
    }

    private var recentSearches: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text("Recent Searches")
                .font(AppFont.headline())
                .foregroundStyle(Color.textPrimary)

            if discoverViewModel.searchHistory.isEmpty {
                Text("No searches yet.")
                    .font(AppFont.caption())
                    .foregroundStyle(Color.textMuted)
            } else {
                ForEach(discoverViewModel.searchHistory.prefix(8)) { item in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.query)
                                .font(AppFont.caption())
                                .foregroundStyle(Color.textPrimary)
                            Text(item.date.formatted(date: .abbreviated, time: .shortened))
                                .font(AppFont.captionSmall())
                                .foregroundStyle(Color.textMuted)
                        }
                        Spacer()
                        Text("\(item.resultCount) results")
                            .font(AppFont.captionSmall())
                            .foregroundStyle(Color.gold)
                    }
                }
            }
        }
        .padding(AppSpacing.md)
        .glassCard(cornerRadius: AppRadius.lg, backgroundOpacity: 1)
    }

    private func progress(for count: Int) -> Double {
        guard let maxValue = discoverViewModel.topMoodCounts.first?.1, maxValue > 0 else { return 0 }
        return Double(count) / Double(maxValue)
    }

    private func recentDays(count: Int) -> [Date] {
        let today = calendar.startOfDay(for: Date())
        return (0..<count).compactMap { offset in
            calendar.date(byAdding: .day, value: -offset, to: today)
        }.reversed()
    }

    private func groupedMoodEntriesByDay() -> [Date: [MoodEntry]] {
        Dictionary(grouping: discoverViewModel.moodHistory) { entry in
            calendar.startOfDay(for: entry.date)
        }
    }
}
