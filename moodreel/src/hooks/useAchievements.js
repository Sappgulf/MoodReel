import { useState, useEffect, useCallback, useMemo } from 'react';

import { StorageKeys as SK } from '../storage/storageKeys';
import { safeGetJSON, safeSetJSON } from '../storage/safeStorage';

const ACHIEVEMENTS_KEY = SK.ACHIEVEMENTS;
const STATS_KEY = SK.ACHIEVEMENT_STATS;

// Achievement definitions
const ACHIEVEMENT_DEFS = [
  {
    id: 'first_save',
    icon: '🎬',
    title: 'First Save',
    description: 'Save your first movie to watchlist',
    condition: stats => stats.totalSaved >= 1,
    threshold: 1,
  },
  {
    id: 'movie_buff',
    icon: '🎥',
    title: 'Movie Buff',
    description: 'Save 10 movies to your watchlist',
    condition: stats => stats.totalSaved >= 10,
    threshold: 10,
  },
  {
    id: 'cinema_hoarder',
    icon: '🏠',
    title: 'Cinema Hoarder',
    description: 'Save 50 movies to your watchlist',
    condition: stats => stats.totalSaved >= 50,
    threshold: 50,
  },
  {
    id: 'binge_watcher',
    icon: '📺',
    title: 'Binge Watcher',
    description: 'Save 5 TV shows',
    condition: stats => stats.tvSaved >= 5,
    threshold: 5,
  },
  {
    id: 'tv_collector',
    icon: '📚',
    title: 'TV Collector',
    description: 'Save 20 TV shows',
    condition: stats => stats.tvSaved >= 20,
    threshold: 20,
  },
  {
    id: 'horror_fan',
    icon: '😱',
    title: 'Horror Fan',
    description: 'Save 3 horror movies',
    condition: stats => stats.horrorSaved >= 3,
    threshold: 3,
  },
  {
    id: 'scare_master',
    icon: '💀',
    title: 'Scare Master',
    description: 'Save 10 horror movies',
    condition: stats => stats.horrorSaved >= 10,
    threshold: 10,
  },
  {
    id: 'hopeless_romantic',
    icon: '💕',
    title: 'Hopeless Romantic',
    description: 'Save 3 romance movies',
    condition: stats => stats.romanceSaved >= 3,
    threshold: 3,
  },
  {
    id: 'love_is_war',
    icon: '🥰',
    title: 'Love is War',
    description: 'Save 10 romance movies',
    condition: stats => stats.romanceSaved >= 10,
    threshold: 10,
  },
  {
    id: 'adrenaline_junkie',
    icon: '🏎️',
    title: 'Adrenaline Junkie',
    description: 'Save 3 action movies',
    condition: stats => (stats.actionSaved || 0) >= 3,
    threshold: 3,
  },
  {
    id: 'action_hero',
    icon: '💪',
    title: 'Action Hero',
    description: 'Save 10 action movies',
    condition: stats => (stats.actionSaved || 0) >= 10,
    threshold: 10,
  },
  {
    id: 'laughter_best',
    icon: '😂',
    title: 'Laughter is Best',
    description: 'Save 3 comedy movies',
    condition: stats => (stats.comedySaved || 0) >= 3,
    threshold: 3,
  },
  {
    id: 'comedy_king',
    icon: '👑',
    title: 'Comedy King',
    description: 'Save 10 comedy movies',
    condition: stats => (stats.comedySaved || 0) >= 10,
    threshold: 10,
  },
  {
    id: 'deep_thinker',
    icon: '🧠',
    title: 'Deep Thinker',
    description: 'Save 3 mystery or sci-fi movies',
    condition: stats => (stats.thoughtfulSaved || 0) >= 3,
    threshold: 3,
  },
  {
    id: 'stargazer',
    icon: '🚀',
    title: 'Stargazer',
    description: 'Save 10 sci-fi movies',
    condition: stats => (stats.sciFiSaved || 0) >= 10,
    threshold: 10,
  },
  {
    id: 'family_first',
    icon: '👨‍👩‍👧‍👦',
    title: 'Family First',
    description: 'Save 3 family or animation movies',
    condition: stats => (stats.familySaved || 0) >= 3,
    threshold: 3,
  },
  {
    id: 'animation_fan',
    icon: '🎨',
    title: 'Animation Fan',
    description: 'Save 5 animated films',
    condition: stats => (stats.animationSaved || 0) >= 5,
    threshold: 5,
  },
  {
    id: 'trendsetter',
    icon: '🔥',
    title: 'Trendsetter',
    description: 'Use Surprise Me 3 times',
    condition: stats => stats.surpriseCount >= 3,
    threshold: 3,
  },
  {
    id: 'wild_card',
    icon: '🃏',
    title: 'Wild Card',
    description: 'Use Surprise Me 10 times',
    condition: stats => stats.surpriseCount >= 10,
    threshold: 10,
  },
  {
    id: 'consistent',
    icon: '📅',
    title: 'Consistent',
    description: 'Search for movies 5 days in a row',
    condition: stats => stats.searchStreak >= 5,
    threshold: 5,
  },
  {
    id: 'dedicated',
    icon: '⭐',
    title: 'Dedicated',
    description: 'Search for movies 7 days in a row',
    condition: stats => stats.searchStreak >= 7,
    threshold: 7,
  },
  {
    id: 'legendary_streak',
    icon: '🏆',
    title: 'Legendary Streak',
    description: 'Maintain a 14-day search streak',
    condition: stats => stats.searchStreak >= 14,
    threshold: 14,
  },
  {
    id: 'streak_master',
    icon: '💎',
    title: 'Streak Master',
    description: 'Maintain a 30-day search streak',
    condition: stats => stats.searchStreak >= 30,
    threshold: 30,
  },
  {
    id: 'critic',
    icon: '🎭',
    title: 'Critic',
    description: 'Rate 5 movies',
    condition: stats => stats.ratingsGiven >= 5,
    threshold: 5,
  },
  {
    id: 'master_critic',
    icon: '🌟',
    title: 'Master Critic',
    description: 'Rate 25 movies',
    condition: stats => stats.ratingsGiven >= 25,
    threshold: 25,
  },
  {
    id: 'night_owl',
    icon: '🦉',
    title: 'Night Owl',
    description: 'Search for movies after midnight',
    condition: stats => stats.nightSearches >= 1,
    threshold: 1,
  },
  {
    id: 'early_bird',
    icon: '🐦',
    title: 'Early Bird',
    description: 'Search for movies before 6 AM',
    condition: stats => stats.earlySearches >= 1,
    threshold: 1,
  },
  {
    id: 'explorer',
    icon: '🔍',
    title: 'Explorer',
    description: 'Use 10 different mood searches',
    condition: stats => (stats.uniqueMoods || 0) >= 10,
    threshold: 10,
  },
];

/**
 * Hook for managing achievements and gamification
 */
export function useAchievements() {
  const [unlockedIds, setUnlockedIds] = useState(() => {
    return safeGetJSON(ACHIEVEMENTS_KEY, []);
  });

  const [stats, setStats] = useState(() => {
    return safeGetJSON(STATS_KEY, {
      totalSaved: 0,
      tvSaved: 0,
      horrorSaved: 0,
      romanceSaved: 0,
      actionSaved: 0,
      comedySaved: 0,
      thoughtfulSaved: 0,
      familySaved: 0,
      sciFiSaved: 0,
      animationSaved: 0,
      surpriseCount: 0,
      searchStreak: 0,
      ratingsGiven: 0,
      ratedMovieIds: [],
      lastSearchDate: null,
      nightSearches: 0,
      earlySearches: 0,
      uniqueMoods: [],
      searchedMoods: [],
    });
  });

  const [newUnlock, setNewUnlock] = useState(null);

  // Persist to localStorage
  useEffect(() => {
    safeSetJSON(ACHIEVEMENTS_KEY, unlockedIds);
  }, [unlockedIds]);

  useEffect(() => {
    safeSetJSON(STATS_KEY, stats);
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
  const trackSave = useCallback(movie => {
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
        tvSaved: prev.tvSaved || 0,
        sciFiSaved: prev.sciFiSaved || 0,
        animationSaved: prev.animationSaved || 0,
      };

      // Check media type
      if (movie.media_type === 'tv') {
        newStats.tvSaved += 1;
      }

      // Check genres
      const genreIds = movie.genre_ids || movie.genres?.map(g => g.id) || [];
      if (genreIds.includes(27)) {
        // Horror
        newStats.horrorSaved += 1;
      }
      if (genreIds.includes(10749)) {
        // Romance
        newStats.romanceSaved += 1;
      }
      if (genreIds.includes(28)) {
        // Action
        newStats.actionSaved += 1;
      }
      if (genreIds.includes(35)) {
        // Comedy
        newStats.comedySaved += 1;
      }
      if (genreIds.includes(878)) {
        // Sci-Fi
        newStats.sciFiSaved += 1;
        newStats.thoughtfulSaved += 1;
      }
      if (genreIds.includes(9648)) {
        // Mystery
        newStats.thoughtfulSaved += 1;
      }
      if (genreIds.includes(10751)) {
        // Family
        newStats.familySaved += 1;
      }
      if (genreIds.includes(16)) {
        // Animation
        newStats.animationSaved += 1;
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
  const trackSearch = useCallback(mood => {
    const today = new Date().toDateString();

    setStats(prev => {
      const hour = new Date().getHours();

      if (prev.lastSearchDate === today) {
        // Update mood tracking even if already searched today
        const moods = prev.searchedMoods || [];
        const newMoods = mood && !moods.includes(mood) ? [...moods, mood] : moods;
        return {
          ...prev,
          searchedMoods: newMoods,
          uniqueMoods: [...new Set(newMoods)],
        };
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = prev.lastSearchDate === yesterday.toDateString();

      const newStreak = wasYesterday ? (prev.searchStreak || 0) + 1 : 1;

      // Track time-of-day searches
      let nightIncrem = 0;
      let earlyIncrem = 0;
      if (hour >= 0 && hour < 5) nightIncrem = 1;
      else if (hour >= 5 && hour < 6) earlyIncrem = 1;

      return {
        ...prev,
        lastSearchDate: today,
        searchStreak: newStreak,
        nightSearches: (prev.nightSearches || 0) + nightIncrem,
        earlySearches: (prev.earlySearches || 0) + earlyIncrem,
        searchedMoods: mood
          ? [...new Set([...(prev.searchedMoods || []), mood])]
          : prev.searchedMoods || [],
        uniqueMoods: mood
          ? [...new Set([...(prev.uniqueMoods || []), mood])]
          : prev.uniqueMoods || [],
      };
    });
  }, []);

  // Track rating (only count unique movies)
  const trackRating = useCallback(movieId => {
    setStats(prev => {
      // Skip if already rated this movie
      if (prev.ratedMovieIds?.includes(movieId)) {
        return prev;
      }
      return {
        ...prev,
        ratingsGiven: (prev.ratingsGiven || 0) + 1,
        ratedMovieIds: [...(prev.ratedMovieIds || []), movieId],
      };
    });
  }, []);

  // Get achievement status
  const getAchievements = useCallback(() => {
    return ACHIEVEMENT_DEFS.map(def => ({
      ...def,
      unlocked: (unlockedIds || []).includes(def.id),
      progress: getProgress(def, stats),
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

  const { level, exp, currentLevelExp, nextLevelExp, progressToNextLevel } = useMemo(() => {
    const totalXp = Math.max(
      0,
      (stats.totalSaved || 0) * 8 +
        (stats.ratingsGiven || 0) * 6 +
        (stats.searchStreak || 0) * 4 +
        (stats.uniqueMoods?.length || 0) * 3 +
        (stats.surpriseCount || 0) * 2
    );

    if (totalXp === 0) {
      return {
        level: 1,
        exp: 0,
        currentLevelExp: 0,
        nextLevelExp: 100,
        progressToNextLevel: 0,
      };
    }

    const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
    const currentLevelExp = (level - 1) * (level - 1) * 100;
    const nextLevelExp = level * level * 100;
    const progressToNextLevel = Math.min(
      100,
      ((totalXp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100
    );

    return {
      level,
      exp: totalXp - currentLevelExp,
      currentLevelExp,
      nextLevelExp,
      progressToNextLevel,
    };
  }, [stats]);

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
    stats,
    level,
    exp,
    currentLevelExp,
    nextLevelExp,
    progressToNextLevel,
  };
}

// Helper to get progress percentage
function getProgress(achievement, stats) {
  switch (achievement.id) {
    case 'first_save':
      return Math.min(100, (stats.totalSaved / achievement.threshold) * 100);
    case 'movie_buff':
    case 'cinema_hoarder':
      return Math.min(100, (stats.totalSaved / achievement.threshold) * 100);
    case 'binge_watcher':
    case 'tv_collector':
      return Math.min(100, (stats.tvSaved / achievement.threshold) * 100);
    case 'horror_fan':
    case 'scare_master':
      return Math.min(100, (stats.horrorSaved / achievement.threshold) * 100);
    case 'hopeless_romantic':
    case 'love_is_war':
      return Math.min(100, (stats.romanceSaved / achievement.threshold) * 100);
    case 'adrenaline_junkie':
    case 'action_hero':
      return Math.min(100, ((stats.actionSaved || 0) / achievement.threshold) * 100);
    case 'laughter_best':
    case 'comedy_king':
      return Math.min(100, ((stats.comedySaved || 0) / achievement.threshold) * 100);
    case 'deep_thinker':
      return Math.min(100, ((stats.thoughtfulSaved || 0) / achievement.threshold) * 100);
    case 'stargazer':
      return Math.min(100, ((stats.sciFiSaved || 0) / achievement.threshold) * 100);
    case 'family_first':
      return Math.min(100, ((stats.familySaved || 0) / achievement.threshold) * 100);
    case 'animation_fan':
      return Math.min(100, ((stats.animationSaved || 0) / achievement.threshold) * 100);
    case 'trendsetter':
    case 'wild_card':
      return Math.min(100, ((stats.surpriseCount || 0) / achievement.threshold) * 100);
    case 'consistent':
    case 'dedicated':
    case 'legendary_streak':
    case 'streak_master':
      return Math.min(100, ((stats.searchStreak || 0) / achievement.threshold) * 100);
    case 'critic':
    case 'master_critic':
      return Math.min(100, ((stats.ratingsGiven || 0) / achievement.threshold) * 100);
    case 'night_owl':
      return Math.min(100, ((stats.nightSearches || 0) / achievement.threshold) * 100);
    case 'early_bird':
      return Math.min(100, ((stats.earlySearches || 0) / achievement.threshold) * 100);
    case 'explorer':
      return Math.min(100, ((stats.uniqueMoods || []).length / achievement.threshold) * 100);
    default:
      return 0;
  }
}

export default useAchievements;
