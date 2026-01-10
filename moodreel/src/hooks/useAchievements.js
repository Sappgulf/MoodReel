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
            const newStats = { ...prev, totalSaved: prev.totalSaved + 1 };

            // Check media type
            if (movie.media_type === 'tv') {
                newStats.tvSaved = prev.tvSaved + 1;
            }

            // Check genres
            const genreIds = movie.genre_ids || [];
            if (genreIds.includes(27)) { // Horror
                newStats.horrorSaved = prev.horrorSaved + 1;
            }
            if (genreIds.includes(10749)) { // Romance
                newStats.romanceSaved = prev.romanceSaved + 1;
            }

            return newStats;
        });
    }, []);

    // Track surprise me usage
    const trackSurprise = useCallback(() => {
        setStats(prev => ({ ...prev, surpriseCount: prev.surpriseCount + 1 }));
    }, []);

    // Track search (for streak)
    const trackSearch = useCallback(() => {
        const today = new Date().toDateString();
        setStats(prev => {
            if (prev.lastSearchDate === today) return prev;

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const wasYesterday = prev.lastSearchDate === yesterday.toDateString();

            return {
                ...prev,
                lastSearchDate: today,
                searchStreak: wasYesterday ? prev.searchStreak + 1 : 1
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
                ratingsGiven: prev.ratingsGiven + 1,
                ratedMovieIds: [...(prev.ratedMovieIds || []), movieId]
            };
        });
    }, []);

    // Get achievement status
    const getAchievements = useCallback(() => {
        return ACHIEVEMENT_DEFS.map(def => ({
            ...def,
            unlocked: unlockedIds.includes(def.id),
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
        case 'trendsetter':
            return Math.min(100, (stats.surpriseCount / achievement.threshold) * 100);
        case 'consistent':
            return Math.min(100, (stats.searchStreak / achievement.threshold) * 100);
        case 'critic':
            return Math.min(100, (stats.ratingsGiven / achievement.threshold) * 100);
        default:
            return 0;
    }
}

export default useAchievements;
