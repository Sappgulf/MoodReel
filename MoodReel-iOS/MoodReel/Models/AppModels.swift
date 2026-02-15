import Foundation
import SwiftUI

// MARK: - Mood Type

enum MoodType: String, Codable, CaseIterable, Identifiable {
    case happy = "happy"
    case sad = "sad"
    case excited = "excited"
    case relaxed = "relaxed"
    case scared = "scared"
    case romantic = "romantic"
    case angry = "angry"
    case nostalgic = "nostalgic"
    case inspired = "inspired"
    case curious = "curious"
    case melancholic = "melancholic"
    case adventurous = "adventurous"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .happy: return "Happy"
        case .sad: return "Sad"
        case .excited: return "Excited"
        case .relaxed: return "Relaxed"
        case .scared: return "Scared"
        case .romantic: return "Romantic"
        case .angry: return "Angry"
        case .nostalgic: return "Nostalgic"
        case .inspired: return "Inspired"
        case .curious: return "Curious"
        case .melancholic: return "Melancholic"
        case .adventurous: return "Adventurous"
        }
    }

    var emoji: String {
        switch self {
        case .happy: return "😄"
        case .sad: return "😢"
        case .excited: return "🤩"
        case .relaxed: return "😌"
        case .scared: return "😱"
        case .romantic: return "🥰"
        case .angry: return "😤"
        case .nostalgic: return "🌅"
        case .inspired: return "✨"
        case .curious: return "🧐"
        case .melancholic: return "🌧️"
        case .adventurous: return "🌎"
        }
    }

    var color: Color {
        switch self {
        case .happy: return Color(hex: "#ffd700")
        case .sad: return Color(hex: "#6495ed")
        case .excited: return Color(hex: "#ff4500")
        case .relaxed: return Color(hex: "#3cb371")
        case .scared: return Color(hex: "#800080")
        case .romantic: return Color(hex: "#ff69b4")
        case .angry: return Color(hex: "#dc143c")
        case .nostalgic: return Color(hex: "#daa520")
        case .inspired: return Color(hex: "#00ced1")
        case .curious: return Color(hex: "#9370db")
        case .melancholic: return Color(hex: "#778899")
        case .adventurous: return Color(hex: "#228b22")
        }
    }

    var secondaryColor: Color {
        switch self {
        case .happy: return Color(hex: "#ffb347")
        case .sad: return Color(hex: "#4169e1")
        case .excited: return Color(hex: "#ff6347")
        case .relaxed: return Color(hex: "#2e8b57")
        case .scared: return Color(hex: "#4b0082")
        case .romantic: return Color(hex: "#ff1493")
        case .angry: return Color(hex: "#8b0000")
        case .nostalgic: return Color(hex: "#b8860b")
        case .inspired: return Color(hex: "#008b8b")
        case .curious: return Color(hex: "#6a0dad")
        case .melancholic: return Color(hex: "#696969")
        case .adventurous: return Color(hex: "#006400")
        }
    }

    var gradient: LinearGradient {
        LinearGradient(
            colors: [color, secondaryColor],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    var description: String {
        switch self {
        case .happy: return "Uplifting comedies & feel-good films"
        case .sad: return "Emotional dramas that resonate deeply"
        case .excited: return "Action-packed thrillers & blockbusters"
        case .relaxed: return "Cozy films for unwinding"
        case .scared: return "Spine-chilling horror & suspense"
        case .romantic: return "Sweeping love stories & romance"
        case .angry: return "Intense dramas & powerful narratives"
        case .nostalgic: return "Classic films & beloved favorites"
        case .inspired: return "Motivating biopics & true stories"
        case .curious: return "Mind-bending mysteries & sci-fi"
        case .melancholic: return "Thoughtful, introspective stories"
        case .adventurous: return "Epic adventures & explorations"
        }
    }

    var genreIds: [Int] {
        switch self {
        case .happy: return [35, 10751, 16]
        case .sad: return [18, 10749]
        case .excited: return [28, 12, 53]
        case .relaxed: return [35, 10751, 14]
        case .scared: return [27, 9648, 53]
        case .romantic: return [10749, 18, 35]
        case .angry: return [18, 80, 53]
        case .nostalgic: return [18, 10751, 36]
        case .inspired: return [36, 18, 99]
        case .curious: return [9648, 878, 99]
        case .melancholic: return [18, 10749]
        case .adventurous: return [12, 14, 28]
        }
    }

    var tmdbKeywords: [String] {
        switch self {
        case .happy: return ["feel-good", "comedy", "uplifting", "heartwarming"]
        case .sad: return ["emotional", "tragedy", "drama", "tearjerker"]
        case .excited: return ["action", "thrilling", "blockbuster", "intense"]
        case .relaxed: return ["slice of life", "cozy", "lighthearted", "warm"]
        case .scared: return ["horror", "terrifying", "supernatural", "suspense"]
        case .romantic: return ["romance", "love story", "passion", "relationship"]
        case .angry: return ["revenge", "justice", "intense drama", "conflict"]
        case .nostalgic: return ["classic", "retro", "coming of age", "memories"]
        case .inspired: return ["inspirational", "true story", "overcoming", "triumph"]
        case .curious: return ["mystery", "sci-fi", "mind-bending", "discovery"]
        case .melancholic: return ["introspective", "bittersweet", "quiet", "longing"]
        case .adventurous: return ["adventure", "exploration", "journey", "discovery"]
        }
    }
}

// MARK: - WatchlistItem

struct WatchlistItem: Codable, Identifiable, Hashable {
    let id: UUID
    let mediaId: Int
    let mediaType: MediaType
    let title: String
    let posterPath: String?
    let backdropPath: String?
    let voteAverage: Double
    let releaseYear: String?
    let overview: String?
    let dateAdded: Date
    var isWatched: Bool
    var watchedDate: Date?
    var userRating: Double?
    var userNotes: String?
    var moodWhenAdded: MoodType?
    var moodWhenWatched: MoodType?
    var isFavorite: Bool
    var tags: [String]

    var posterURL: URL? {
        guard let path = posterPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w500\(path)")
    }

    var backdropURL: URL? {
        guard let path = backdropPath else { return nil }
        return URL(string: "https://image.tmdb.org/t/p/w1280\(path)")
    }

    init(
        id: UUID = UUID(),
        mediaId: Int,
        mediaType: MediaType,
        title: String,
        posterPath: String? = nil,
        backdropPath: String? = nil,
        voteAverage: Double = 0,
        releaseYear: String? = nil,
        overview: String? = nil,
        dateAdded: Date = Date(),
        isWatched: Bool = false,
        watchedDate: Date? = nil,
        userRating: Double? = nil,
        userNotes: String? = nil,
        moodWhenAdded: MoodType? = nil,
        moodWhenWatched: MoodType? = nil,
        isFavorite: Bool = false,
        tags: [String] = []
    ) {
        self.id = id
        self.mediaId = mediaId
        self.mediaType = mediaType
        self.title = title
        self.posterPath = posterPath
        self.backdropPath = backdropPath
        self.voteAverage = voteAverage
        self.releaseYear = releaseYear
        self.overview = overview
        self.dateAdded = dateAdded
        self.isWatched = isWatched
        self.watchedDate = watchedDate
        self.userRating = userRating
        self.userNotes = userNotes
        self.moodWhenAdded = moodWhenAdded
        self.moodWhenWatched = moodWhenWatched
        self.isFavorite = isFavorite
        self.tags = tags
    }

    static func from(movie: Movie, mood: MoodType? = nil) -> WatchlistItem {
        WatchlistItem(
            mediaId: movie.id,
            mediaType: .movie,
            title: movie.title,
            posterPath: movie.posterPath,
            backdropPath: movie.backdropPath,
            voteAverage: movie.voteAverage,
            releaseYear: movie.releaseYear,
            overview: movie.overview,
            moodWhenAdded: mood
        )
    }

    static func from(tvShow: TVShow, mood: MoodType? = nil) -> WatchlistItem {
        WatchlistItem(
            mediaId: tvShow.id,
            mediaType: .tv,
            title: tvShow.name,
            posterPath: tvShow.posterPath,
            backdropPath: tvShow.backdropPath,
            voteAverage: tvShow.voteAverage,
            releaseYear: tvShow.firstAirYear,
            overview: tvShow.overview,
            moodWhenAdded: mood
        )
    }
}

// MARK: - Mood Entry

struct MoodEntry: Codable, Identifiable, Hashable {
    let id: UUID
    let mood: MoodType
    let date: Date
    let intensity: Double
    var note: String?
    var watchedMediaIds: [Int]
    var relatedMoodReelItems: [UUID]

    init(
        id: UUID = UUID(),
        mood: MoodType,
        date: Date = Date(),
        intensity: Double = 0.7,
        note: String? = nil,
        watchedMediaIds: [Int] = [],
        relatedMoodReelItems: [UUID] = []
    ) {
        self.id = id
        self.mood = mood
        self.date = date
        self.intensity = intensity
        self.note = note
        self.watchedMediaIds = watchedMediaIds
        self.relatedMoodReelItems = relatedMoodReelItems
    }
}

// MARK: - Achievement

enum AchievementType: String, Codable, CaseIterable {
    // Watchlist milestones
    case firstWatch = "first_watch"
    case watchlistTen = "watchlist_ten"
    case watchlistFifty = "watchlist_fifty"
    case watchlistHundred = "watchlist_hundred"
    case watchlistFiveHundred = "watchlist_five_hundred"

    // Mood milestones
    case moodExplorer = "mood_explorer"
    case moodMaster = "mood_master"
    case allMoodsUnlocked = "all_moods_unlocked"
    case moodStreak = "mood_streak"

    // Rating milestones
    case firstRating = "first_rating"
    case tenRatings = "ten_ratings"
    case fiftyRatings = "fifty_ratings"

    // Discovery milestones
    case genreHopper = "genre_hopper"
    case worldCinema = "world_cinema"
    case classicCinema = "classic_cinema"
    case modernCinema = "modern_cinema"

    // Social / streak
    case weekStreak = "week_streak"
    case monthStreak = "month_streak"
    case nightOwl = "night_owl"
    case earlyBird = "early_bird"
    case bingeWatcher = "binge_watcher"

    var displayName: String {
        switch self {
        case .firstWatch: return "First Frame"
        case .watchlistTen: return "Cine-curious"
        case .watchlistFifty: return "Film Buff"
        case .watchlistHundred: return "Cinephile"
        case .watchlistFiveHundred: return "Grand Auteur"
        case .moodExplorer: return "Mood Explorer"
        case .moodMaster: return "Mood Master"
        case .allMoodsUnlocked: return "Emotional Spectrum"
        case .moodStreak: return "Feeling It"
        case .firstRating: return "Critic Emerges"
        case .tenRatings: return "Junior Critic"
        case .fiftyRatings: return "Film Critic"
        case .genreHopper: return "Genre Hopper"
        case .worldCinema: return "World Cinema"
        case .classicCinema: return "Time Traveler"
        case .modernCinema: return "Contemporary"
        case .weekStreak: return "Week Warrior"
        case .monthStreak: return "Monthly Devotee"
        case .nightOwl: return "Night Owl"
        case .earlyBird: return "Early Screening"
        case .bingeWatcher: return "Binge Watcher"
        }
    }

    var description: String {
        switch self {
        case .firstWatch: return "Watched your first film on MoodReel"
        case .watchlistTen: return "Added 10 titles to your watchlist"
        case .watchlistFifty: return "Added 50 titles to your watchlist"
        case .watchlistHundred: return "Watched 100 titles — a true cinephile"
        case .watchlistFiveHundred: return "Watched 500 titles — you are the auteur"
        case .moodExplorer: return "Discovered films in 5 different moods"
        case .moodMaster: return "Discovered films in all 12 moods"
        case .allMoodsUnlocked: return "Experienced the full emotional spectrum"
        case .moodStreak: return "Logged your mood for 7 consecutive days"
        case .firstRating: return "Rated your first film"
        case .tenRatings: return "Rated 10 films"
        case .fiftyRatings: return "Rated 50 films — a true critic"
        case .genreHopper: return "Watched films across 8 different genres"
        case .worldCinema: return "Watched films from 5 different countries"
        case .classicCinema: return "Watched a film from before 1980"
        case .modernCinema: return "Watched 10 films from the last 2 years"
        case .weekStreak: return "Used MoodReel every day for a week"
        case .monthStreak: return "Used MoodReel every day for a month"
        case .nightOwl: return "Watched a film after midnight"
        case .earlyBird: return "Watched a film before 7am"
        case .bingeWatcher: return "Watched 5 films in a single day"
        }
    }

    var icon: String {
        switch self {
        case .firstWatch: return "play.circle.fill"
        case .watchlistTen: return "film.stack"
        case .watchlistFifty: return "film.stack.fill"
        case .watchlistHundred: return "trophy"
        case .watchlistFiveHundred: return "crown.fill"
        case .moodExplorer: return "face.smiling"
        case .moodMaster: return "sparkles"
        case .allMoodsUnlocked: return "rainbow"
        case .moodStreak: return "heart.fill"
        case .firstRating: return "star"
        case .tenRatings: return "star.leadinghalf.filled"
        case .fiftyRatings: return "star.fill"
        case .genreHopper: return "theatermasks.fill"
        case .worldCinema: return "globe.americas.fill"
        case .classicCinema: return "clock.fill"
        case .modernCinema: return "bolt.fill"
        case .weekStreak: return "calendar.badge.checkmark"
        case .monthStreak: return "calendar.circle.fill"
        case .nightOwl: return "moon.stars.fill"
        case .earlyBird: return "sunrise.fill"
        case .bingeWatcher: return "popcorn.fill"
        }
    }

    var emoji: String {
        switch self {
        case .firstWatch: return "🎬"
        case .watchlistTen: return "🎞"
        case .watchlistFifty: return "📽"
        case .watchlistHundred: return "🏆"
        case .watchlistFiveHundred: return "👑"
        case .moodExplorer: return "🎭"
        case .moodMaster: return "✨"
        case .allMoodsUnlocked: return "🌈"
        case .moodStreak: return "💖"
        case .firstRating: return "⭐️"
        case .tenRatings: return "🌟"
        case .fiftyRatings: return "🎖"
        case .genreHopper: return "🎨"
        case .worldCinema: return "🌍"
        case .classicCinema: return "⏳"
        case .modernCinema: return "⚡️"
        case .weekStreak: return "🗓"
        case .monthStreak: return "📅"
        case .nightOwl: return "🦉"
        case .earlyBird: return "🐦"
        case .bingeWatcher: return "🍿"
        }
    }

    var rarity: AchievementRarity {
        switch self {
        case .firstWatch, .firstRating: return .common
        case .watchlistTen, .watchlistFifty, .moodExplorer, .genreHopper: return .uncommon
        case .watchlistHundred, .moodMaster, .tenRatings, .worldCinema, .weekStreak: return .rare
        case .watchlistFiveHundred, .allMoodsUnlocked, .fiftyRatings, .monthStreak, .bingeWatcher: return .epic
        case .classicCinema, .modernCinema, .nightOwl, .earlyBird, .moodStreak: return .legendary
        }
    }

    var points: Int {
        switch rarity {
        case .common: return 10
        case .uncommon: return 25
        case .rare: return 50
        case .epic: return 100
        case .legendary: return 200
        }
    }
}

enum AchievementRarity: String, Codable {
    case common
    case uncommon
    case rare
    case epic
    case legendary

    var displayName: String {
        switch self {
        case .common: return "Common"
        case .uncommon: return "Uncommon"
        case .rare: return "Rare"
        case .epic: return "Epic"
        case .legendary: return "Legendary"
        }
    }

    var color: Color {
        switch self {
        case .common: return Color(hex: "#a1a1aa")
        case .uncommon: return Color(hex: "#22c55e")
        case .rare: return Color(hex: "#3b82f6")
        case .epic: return Color(hex: "#a855f7")
        case .legendary: return Color(hex: "#ffd700")
        }
    }

    var gradient: LinearGradient {
        switch self {
        case .common:
            return LinearGradient(colors: [Color(hex: "#71717a"), Color(hex: "#52525b")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .uncommon:
            return LinearGradient(colors: [Color(hex: "#22c55e"), Color(hex: "#16a34a")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .rare:
            return LinearGradient(colors: [Color(hex: "#3b82f6"), Color(hex: "#2563eb")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .epic:
            return LinearGradient(colors: [Color(hex: "#a855f7"), Color(hex: "#9333ea")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .legendary:
            return LinearGradient(colors: [Color(hex: "#ffd700"), Color(hex: "#f5a623"), Color(hex: "#c78b1a")], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }
}

struct Achievement: Codable, Identifiable, Hashable {
    let id: UUID
    let type: AchievementType
    let unlockedDate: Date?
    let progress: Double
    let isUnlocked: Bool

    init(
        id: UUID = UUID(),
        type: AchievementType,
        unlockedDate: Date? = nil,
        progress: Double = 0,
        isUnlocked: Bool = false
    ) {
        self.id = id
        self.type = type
        self.unlockedDate = unlockedDate
        self.progress = progress
        self.isUnlocked = isUnlocked
    }

    var displayName: String { type.displayName }
    var description: String { type.description }
    var icon: String { type.icon }
    var emoji: String { type.emoji }
    var rarity: AchievementRarity { type.rarity }
    var points: Int { type.points }

    static func allAchievements() -> [Achievement] {
        AchievementType.allCases.map { Achievement(type: $0) }
    }
}

// MARK: - Filter Options

struct FilterOptions: Codable, Equatable {
    var genres: [Int]
    var minRating: Double
    var maxRating: Double
    var minYear: Int?
    var maxYear: Int?
    var mediaTypes: [MediaType]
    var languages: [String]
    var sortBy: SortOption
    var includeAdult: Bool

    init(
        genres: [Int] = [],
        minRating: Double = 0,
        maxRating: Double = 10,
        minYear: Int? = nil,
        maxYear: Int? = nil,
        mediaTypes: [MediaType] = [.movie, .tv],
        languages: [String] = [],
        sortBy: SortOption = .popularity,
        includeAdult: Bool = false
    ) {
        self.genres = genres
        self.minRating = minRating
        self.maxRating = maxRating
        self.minYear = minYear
        self.maxYear = maxYear
        self.mediaTypes = mediaTypes
        self.languages = languages
        self.sortBy = sortBy
        self.includeAdult = includeAdult
    }

    var isDefault: Bool {
        genres.isEmpty &&
        minRating == 0 &&
        maxRating == 10 &&
        minYear == nil &&
        maxYear == nil &&
        mediaTypes.count == 2 &&
        languages.isEmpty &&
        sortBy == .popularity &&
        !includeAdult
    }

    mutating func reset() {
        genres = []
        minRating = 0
        maxRating = 10
        minYear = nil
        maxYear = nil
        mediaTypes = [.movie, .tv]
        languages = []
        sortBy = .popularity
        includeAdult = false
    }
}

enum SortOption: String, Codable, CaseIterable {
    case popularity = "popularity.desc"
    case rating = "vote_average.desc"
    case newest = "release_date.desc"
    case oldest = "release_date.asc"
    case revenue = "revenue.desc"
    case titleAZ = "title.asc"
    case titleZA = "title.desc"

    var displayName: String {
        switch self {
        case .popularity: return "Most Popular"
        case .rating: return "Highest Rated"
        case .newest: return "Newest First"
        case .oldest: return "Oldest First"
        case .revenue: return "Highest Grossing"
        case .titleAZ: return "Title A-Z"
        case .titleZA: return "Title Z-A"
        }
    }

    var icon: String {
        switch self {
        case .popularity: return "flame.fill"
        case .rating: return "star.fill"
        case .newest: return "calendar"
        case .oldest: return "clock"
        case .revenue: return "dollarsign.circle.fill"
        case .titleAZ: return "textformat.abc"
        case .titleZA: return "textformat.abc"
        }
    }
}

// MARK: - User Profile

struct UserProfile: Codable, Identifiable {
    let id: UUID
    var username: String
    var displayName: String
    var avatarURL: String?
    var bio: String?
    var joinedDate: Date
    var totalWatched: Int
    var totalRatings: Int
    var favoriteGenres: [Int]
    var favoriteMoods: [MoodType]
    var achievements: [Achievement]
    var moodHistory: [MoodEntry]
    var watchlistIds: [UUID]
    var totalPoints: Int
    var currentStreak: Int
    var longestStreak: Int
    var lastActiveDate: Date?
    var preferredLanguage: String
    var notificationsEnabled: Bool
    var hapticFeedbackEnabled: Bool
    var appearanceMode: AppearanceMode

    init(
        id: UUID = UUID(),
        username: String = "cinephile",
        displayName: String = "Film Enthusiast",
        avatarURL: String? = nil,
        bio: String? = nil,
        joinedDate: Date = Date(),
        totalWatched: Int = 0,
        totalRatings: Int = 0,
        favoriteGenres: [Int] = [],
        favoriteMoods: [MoodType] = [],
        achievements: [Achievement] = [],
        moodHistory: [MoodEntry] = [],
        watchlistIds: [UUID] = [],
        totalPoints: Int = 0,
        currentStreak: Int = 0,
        longestStreak: Int = 0,
        lastActiveDate: Date? = nil,
        preferredLanguage: String = "en",
        notificationsEnabled: Bool = true,
        hapticFeedbackEnabled: Bool = true,
        appearanceMode: AppearanceMode = .dark
    ) {
        self.id = id
        self.username = username
        self.displayName = displayName
        self.avatarURL = avatarURL
        self.bio = bio
        self.joinedDate = joinedDate
        self.totalWatched = totalWatched
        self.totalRatings = totalRatings
        self.favoriteGenres = favoriteGenres
        self.favoriteMoods = favoriteMoods
        self.achievements = achievements
        self.moodHistory = moodHistory
        self.watchlistIds = watchlistIds
        self.totalPoints = totalPoints
        self.currentStreak = currentStreak
        self.longestStreak = longestStreak
        self.lastActiveDate = lastActiveDate
        self.preferredLanguage = preferredLanguage
        self.notificationsEnabled = notificationsEnabled
        self.hapticFeedbackEnabled = hapticFeedbackEnabled
        self.appearanceMode = appearanceMode
    }

    var unlockedAchievements: [Achievement] {
        achievements.filter { $0.isUnlocked }
    }

    var level: Int {
        max(1, totalPoints / 100)
    }

    var levelTitle: String {
        switch level {
        case 1...5: return "Newcomer"
        case 6...10: return "Film Fan"
        case 11...20: return "Cine-curious"
        case 21...35: return "Film Buff"
        case 36...50: return "Cinephile"
        case 51...75: return "Auteur"
        case 76...100: return "Grand Auteur"
        default: return "Legendary Auteur"
        }
    }

    var levelIcon: String {
        switch level {
        case 1...5: return "star"
        case 6...10: return "star.leadinghalf.filled"
        case 11...20: return "star.fill"
        case 21...35: return "film"
        case 36...50: return "film.fill"
        case 51...75: return "trophy"
        case 76...100: return "crown"
        default: return "crown.fill"
        }
    }

    var progressToNextLevel: Double {
        let pointsInCurrentLevel = totalPoints % 100
        return Double(pointsInCurrentLevel) / 100.0
    }

    var mostWatchedMood: MoodType? {
        let moodCounts = Dictionary(grouping: moodHistory, by: { $0.mood })
        return moodCounts.max(by: { $0.value.count < $1.value.count })?.key
    }
}

// MARK: - Appearance Mode

enum AppearanceMode: String, Codable, CaseIterable {
    case dark
    case light
    case system

    var displayName: String {
        switch self {
        case .dark: return "Dark (Cinema Noir)"
        case .light: return "Light"
        case .system: return "System Default"
        }
    }

    var icon: String {
        switch self {
        case .dark: return "moon.fill"
        case .light: return "sun.max.fill"
        case .system: return "circle.lefthalf.filled"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .dark: return .dark
        case .light: return .light
        case .system: return nil
        }
    }
}

// MARK: - App State / Toast

enum ToastType {
    case success(String)
    case error(String)
    case info(String)
    case achievement(Achievement)

    var message: String {
        switch self {
        case .success(let msg): return msg
        case .error(let msg): return msg
        case .info(let msg): return msg
        case .achievement(let ach): return "\(ach.emoji) \(ach.displayName) unlocked!"
        }
    }

    var icon: String {
        switch self {
        case .success: return "checkmark.circle.fill"
        case .error: return "xmark.circle.fill"
        case .info: return "info.circle.fill"
        case .achievement: return "star.fill"
        }
    }

    var color: Color {
        switch self {
        case .success: return .success
        case .error: return .error
        case .info: return .gold
        case .achievement: return .gold
        }
    }
}

// MARK: - Notification

struct AppNotification: Codable, Identifiable, Hashable {
    let id: UUID
    let type: NotificationType
    let title: String
    let body: String
    let date: Date
    var isRead: Bool

    init(
        id: UUID = UUID(),
        type: NotificationType,
        title: String,
        body: String,
        date: Date = Date(),
        isRead: Bool = false
    ) {
        self.id = id
        self.type = type
        self.title = title
        self.body = body
        self.date = date
        self.isRead = isRead
    }
}

enum NotificationType: String, Codable {
    case moodReminder = "mood_reminder"
    case newRelease = "new_release"
    case achievementUnlocked = "achievement_unlocked"
    case watchlistReminder = "watchlist_reminder"
    case weeklyDigest = "weekly_digest"

    var icon: String {
        switch self {
        case .moodReminder: return "face.smiling.fill"
        case .newRelease: return "sparkles"
        case .achievementUnlocked: return "trophy.fill"
        case .watchlistReminder: return "bookmark.fill"
        case .weeklyDigest: return "newspaper.fill"
        }
    }
}

// MARK: - Search History

struct SearchHistoryItem: Codable, Identifiable, Hashable {
    let id: UUID
    let query: String
    let date: Date
    let resultCount: Int

    init(
        id: UUID = UUID(),
        query: String,
        date: Date = Date(),
        resultCount: Int = 0
    ) {
        self.id = id
        self.query = query
        self.date = date
        self.resultCount = resultCount
    }
}

// MARK: - Genre Constants

struct GenreConstants {
    static let movieGenres: [Int: String] = [
        28: "Action",
        12: "Adventure",
        16: "Animation",
        35: "Comedy",
        80: "Crime",
        99: "Documentary",
        18: "Drama",
        10751: "Family",
        14: "Fantasy",
        36: "History",
        27: "Horror",
        10402: "Music",
        9648: "Mystery",
        10749: "Romance",
        878: "Science Fiction",
        10770: "TV Movie",
        53: "Thriller",
        10752: "War",
        37: "Western"
    ]

    static let tvGenres: [Int: String] = [
        10759: "Action & Adventure",
        16: "Animation",
        35: "Comedy",
        80: "Crime",
        99: "Documentary",
        18: "Drama",
        10751: "Family",
        10762: "Kids",
        9648: "Mystery",
        10763: "News",
        10764: "Reality",
        10765: "Sci-Fi & Fantasy",
        10766: "Soap",
        10767: "Talk",
        10768: "War & Politics",
        37: "Western"
    ]

    static func name(for id: Int, mediaType: MediaType = .movie) -> String {
        switch mediaType {
        case .movie: return movieGenres[id] ?? "Unknown"
        case .tv: return tvGenres[id] ?? movieGenres[id] ?? "Unknown"
        default: return movieGenres[id] ?? "Unknown"
        }
    }
}
