import { useState, useEffect, useCallback } from 'react';

const HAS_WINDOW = typeof window !== 'undefined';

/**
 * Get whether it's currently "night time" (between 7pm and 7am)
 */
function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 7; // 7pm to 7am
}

function getSystemDark() {
  if (!HAS_WINDOW) return true;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

/**
 * Custom hook for theme management (dark/light mode)
 * Supports auto-scheduling based on time of day
 * Persists preference in localStorage
 */
export function useTheme() {
  // Auto-schedule preference
  const [autoSchedule, setAutoSchedule] = useState(() => {
    if (!HAS_WINDOW) return false;
    return localStorage.getItem('moodreel-theme-auto') === 'true';
  });

  const [isDark, setIsDark] = useState(() => {
    if (!HAS_WINDOW) return true;
    // If auto-schedule is on, use time-based theme
    if (localStorage.getItem('moodreel-theme-auto') === 'true') {
      return isNightTime();
    }
    const saved = localStorage.getItem('moodreel-theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    // Default to dark, or check system preference
    return getSystemDark();
  });

  // Auto-schedule: check time every minute and update theme
  useEffect(() => {
    if (!autoSchedule) return;

    const checkTime = () => {
      const shouldBeDark = isNightTime();
      setIsDark(shouldBeDark);
    };

    // Check immediately
    checkTime();

    // Check every minute
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [autoSchedule]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light-theme');
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
    }
    if (!autoSchedule && HAS_WINDOW) {
      localStorage.setItem('moodreel-theme', isDark ? 'dark' : 'light');
    }
  }, [isDark, autoSchedule]);

  // Listen to system preference changes
  useEffect(() => {
    if (!HAS_WINDOW) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => {
      if (autoSchedule) {
        setIsDark(isNightTime());
      } else if (localStorage.getItem('moodreel-theme') === null) {
        setIsDark(e.matches);
      }
    };
    if (media.addEventListener) {
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    } else {
      // Legacy Safari
      media.addListener(handler);
      return () => media.removeListener(handler);
    }
  }, [autoSchedule]);

  const toggleTheme = useCallback(() => {
    setAutoSchedule(false);
    if (HAS_WINDOW) localStorage.setItem('moodreel-theme-auto', 'false');
    setIsDark(prev => !prev);
  }, []);

  const toggleAutoSchedule = useCallback(() => {
    setAutoSchedule(prev => {
      const newValue = !prev;
      if (HAS_WINDOW) localStorage.setItem('moodreel-theme-auto', String(newValue));
      if (newValue) {
        // Apply time-based theme immediately
        setIsDark(isNightTime());
      }
      return newValue;
    });
  }, []);

  return { isDark, toggleTheme, autoSchedule, toggleAutoSchedule };
}

export default useTheme;
