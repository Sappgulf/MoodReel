import { useState, useEffect, useCallback } from 'react';

const ACHIEVEMENTS_KEY = 'moodreel-achievements';
const STATS_KEY = 'moodreel-achievement-stats';

// Achievement definitions
const ACHIEVEMENT_DEFS = [
    {
        id: 'first_save',
        icon: '🎬',
        title: 'First Save',
        description: 'Save your first movie to watchlist',
        condition: (stats) => stats.totalSaved >= 1,
        threshold: 1
    },
    {
        id: 'movie_buff',
        icon: '🎥',
        title: 'Movie Buff',
        description: 'Save 10 movies to your watchlist',
        condition: (stats) => stats.totalSaved >= 10,
        threshold: 10
    },
    {
        id: 'binge_watcher',
        icon: '📺',
        title: 'Binge Watcher',
        description: 'Save 5 TV shows',
        condition: (stats) => stats.tvSaved >= 5,
        threshold: 5
    },
    {
        id: 'horror_fan',
        icon: '😱',
        title: 'Horror Fan',
        description: 'Save 3 horror movies',
        condition: (stats) => stats.horrorSaved >= 3,
        threshold: 3
    },
    {
        id: 'hopeless_romantic',
        icon: '💕',
        title: 'Hopeless Romantic',
        description: 'Save 3 romance movies',
        condition: (stats) => stats.romanceSaved >= 3,
        threshold: 3
    },
    {
        id: 'adrenaline_junkie',
        icon: '🏎️',
        title: 'Adrenaline Junkie',
        description: 'Save 3 action movies',
        condition: (stats) => (stats.actionSaved || 0) >= 3,
        threshold: 3
    },
    {
        id: 'laughter_best',
        icon: '😂',
        title: 'Laughter is Best',
        description: 'Save 3 comedy movies',
        condition: (stats) => (stats.comedySaved || 0) >= 3,
        threshold: 3
    },
    {
        id: 'deep_thinker',
        icon: '🧠',
        title: 'Deep Thinker',
        description: 'Save 3 mystery or sci-fi movies',
        condition: (stats) => (stats.thoughtfulSaved || 0) >= 3,
        threshold: 3
    },
    {
        id: 'family_first',
        icon: '👨‍👩‍👧‍👦',
        title: 'Family First',
        description: 'Save 3 family or animation movies',
        condition: (stats) => (stats.familySaved || 0) >= 3,
        threshold: 3
    },
    {
        id: 'trendsetter',
        icon: '🔥',
        title: 'Trendsetter',
        description: 'Use Surprise Me 3 times',
        condition: (stats) => stats.surpriseCount >= 3,
        threshold: 3
    },
    {
        id: 'consistent',
        icon: '📅',
        title: 'Consistent',
        description: 'Search for movies 5 days in a row',
        condition: (stats) => stats.searchStreak >= 5,
        threshold: 5
    },
    {
        id: 'legendary_streak',
        icon: '👑',
        title: 'Legendary Streak',
        description: 'Maintain a 14-day search streak',
        condition: (stats) => stats.searchStreak >= 14,
        threshold: 14
    },
    {
        id: 'critic',
        icon: '⭐',
        title: 'Critic',
        description: 'Rate 5 movies',
        condition: (stats) => stats.ratingsGiven >= 5,
        threshold: 5
    }
];

/**
 * Hook for managing achievements and gamification
 */
export function useAchievements() {
    const [unlockedIds, setUnlockedIds] = useState(() => {
        try {
            const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [stats, setStats] = useState(() => {
        try {
            const saved = localStorage.getItem(STATS_KEY);
            return saved ? JSON.parse(saved) : {
                totalSaved: 0,
                tvSaved: 0,
                horrorSaved: 0,
                romanceSaved: 0,
                actionSaved: 0,
                comedySaved: 0,
                thoughtfulSaved: 0,
                familySaved: 0,
                surpriseCount: 0,
                searchStreak: 0,
                ratingsGiven: 0,
                ratedMovieIds: [],
                lastSearchDate: null
            };
        } catch {
            return {
                totalSaved: 0,
                tvSaved: 0,
                horrorSaved: 0,
                romanceSaved: 0,
                actionSaved: 0,
                comedySaved: 0,
                thoughtfulSaved: 0,
                familySaved: 0,
                surpriseCount: 0,
                searchStreak: 0,
                ratingsGiven: 0,
                ratedMovieIds: [],
                lastSearchDate: null
            };
        }
    });

    const [newUnlock, setNewUnlock] = useState(null);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlockedIds));
    }, [unlockedIds]);

    useEffect(() => {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }, [stats]);

    // Check for new achievements
    // Use functional setState to avoid dependency on unlockedIds (prevents infinite loop)
    const checkAchievements = useCallback(() => {
        setUnlockedIds(prevUnlockedIds => {
            let newUnlockedIds = prevUnlockedIds;
            let latestUnlock = null;

            ACHIEVEMENT_DEFS.forEach(achievement => {
                if (!prevUnlockedIds.includes(achievement.id) && achievement.condition(stats)) {
                    if (newUnlockedIds === prevUnlockedIds) {
                        newUnlockedIds = [...prevUnlockedIds];
                    }
                    newUnlockedIds.push(achievement.id);
                    latestUnlock = achievement;
                }
            });

            // Show toast for the latest unlock
            if (latestUnlock) {
                setTimeout(() => {
                    setNewUnlock(latestUnlock);
                    setTimeout(() => setNewUnlock(null), 4000);
                }, 0);
            }

            return newUnlockedIds;
        });
    }, [stats]);

    // Track movie save
    const trackSave = useCallback((movie) => {
        setStats(prev => {
            const newStats = {
                ...prev,
                totalSaved: prev.totalSaved + 1,
                actionSaved: prev.actionSaved || 0,
                comedySaved: prev.comedySaved || 0,
                thoughtfulSaved: prev.thoughtfulSaved || 0,
                familySaved: prev.familySaved || 0,
                horrorSaved: prev.horrorSaved || 0,
                romanceSaved: prev.romanceSaved || 0,
                tvSaved: prev.tvSaved || 0
            };

            // Check media type
            if (movie.media_type === 'tv') {
                newStats.tvSaved += 1;
            }

            // Check genres
            const genreIds = (movie.genre_ids || movie.genres?.map(g => g.id) || []);
            if (genreIds.includes(27)) { // Horror
                newStats.horrorSaved += 1;
            }
            if (genreIds.includes(10749)) { // Romance
                newStats.romanceSaved += 1;
            }
            if (genreIds.includes(28)) { // Action
                newStats.actionSaved += 1;
            }
            if (genreIds.includes(35)) { // Comedy
                newStats.comedySaved += 1;
            }
            if (genreIds.includes(878) || genreIds.includes(9648)) { // Sci-Fi or Mystery
                newStats.thoughtfulSaved += 1;
            }
            if (genreIds.includes(10751) || genreIds.includes(16)) { // Family or Animation
                newStats.familySaved += 1;
            }

            return newStats;
        });
    }, []);

    // Track surprise me usage
    const trackSurprise = useCallback(() => {
        setStats(prev => ({ ...prev, surpriseCount: (prev.surpriseCount || 0) + 1 }));
    }, []);

    // Track search (for streak)
    const trackSearch = useCallback(() => {
        const today = new Date().toDateString();
        setStats(prev => {
            if (prev.lastSearchDate === today) return prev;

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const wasYesterday = prev.lastSearchDate === yesterday.toDateString();

            const newStreak = wasYesterday ? (prev.searchStreak || 0) + 1 : 1;
            return {
                ...prev,
                lastSearchDate: today,
                searchStreak: newStreak
            };
        });
    }, []);

    // Track rating (only count unique movies)
    const trackRating = useCallback((movieId) => {
        setStats(prev => {
            // Skip if already rated this movie
            if (prev.ratedMovieIds?.includes(movieId)) {
                return prev;
            }
            return {
                ...prev,
                ratingsGiven: (prev.ratingsGiven || 0) + 1,
                ratedMovieIds: [...(prev.ratedMovieIds || []), movieId]
            };
        });
    }, []);

    // Get achievement status
    const getAchievements = useCallback(() => {
        return ACHIEVEMENT_DEFS.map(def => ({
            ...def,
            unlocked: (unlockedIds || []).includes(def.id),
            progress: getProgress(def, stats)
        }));
    }, [unlockedIds, stats]);

    // Dismiss toast
    const dismissToast = useCallback(() => {
        setNewUnlock(null);
    }, []);

    // Check achievements when stats change
    useEffect(() => {
        checkAchievements();
    }, [stats, checkAchievements]);

    return {
        achievements: getAchievements(),
        unlockedCount: unlockedIds.length,
        totalCount: ACHIEVEMENT_DEFS.length,
        newUnlock,
        dismissToast,
        trackSave,
        trackSurprise,
        trackSearch,
        trackRating,
        stats
    };
}

// Helper to get progress percentage
function getProgress(achievement, stats) {
    switch (achievement.id) {
        case 'first_save':
        case 'movie_buff':
            return Math.min(100, (stats.totalSaved / achievement.threshold) * 100);
        case 'binge_watcher':
            return Math.min(100, (stats.tvSaved / achievement.threshold) * 100);
        case 'horror_fan':
            return Math.min(100, (stats.horrorSaved / achievement.threshold) * 100);
        case 'hopeless_romantic':
            return Math.min(100, (stats.romanceSaved / achievement.threshold) * 100);
        case 'adrenaline_junkie':
            return Math.min(100, ((stats.actionSaved || 0) / achievement.threshold) * 100);
        case 'laughter_best':
            return Math.min(100, ((stats.comedySaved || 0) / achievement.threshold) * 100);
        case 'deep_thinker':
            return Math.min(100, ((stats.thoughtfulSaved || 0) / achievement.threshold) * 100);
        case 'family_first':
            return Math.min(100, ((stats.familySaved || 0) / achievement.threshold) * 100);
        case 'trendsetter':
            return Math.min(100, ((stats.surpriseCount || 0) / achievement.threshold) * 100);
        case 'consistent':
        case 'legendary_streak':
            return Math.min(100, ((stats.searchStreak || 0) / achievement.threshold) * 100);
        case 'critic':
            return Math.min(100, ((stats.ratingsGiven || 0) / achievement.threshold) * 100);
        default:
            return 0;
    }
}

export default useAchievements;
