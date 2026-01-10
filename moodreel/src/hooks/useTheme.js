import { useState, useEffect, useCallback } from 'react';

/**
 * Get whether it's currently "night time" (between 7pm and 7am)
 */
function isNightTime() {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 7; // 7pm to 7am
}

/**
 * Custom hook for theme management (dark/light mode)
 * Supports auto-scheduling based on time of day
 * Persists preference in localStorage
 */
export function useTheme() {
    // Auto-schedule preference
    const [autoSchedule, setAutoSchedule] = useState(() => {
        return localStorage.getItem('moodreel-theme-auto') === 'true';
    });

    const [isDark, setIsDark] = useState(() => {
        // If auto-schedule is on, use time-based theme
        if (localStorage.getItem('moodreel-theme-auto') === 'true') {
            return isNightTime();
        }
        const saved = localStorage.getItem('moodreel-theme');
        if (saved !== null) {
            return saved === 'dark';
        }
        // Default to dark, or check system preference
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
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
        if (!autoSchedule) {
            localStorage.setItem('moodreel-theme', isDark ? 'dark' : 'light');
        }
    }, [isDark, autoSchedule]);

    const toggleTheme = useCallback(() => {
        setAutoSchedule(false);
        localStorage.setItem('moodreel-theme-auto', 'false');
        setIsDark(prev => !prev);
    }, []);

    const toggleAutoSchedule = useCallback(() => {
        setAutoSchedule(prev => {
            const newValue = !prev;
            localStorage.setItem('moodreel-theme-auto', String(newValue));
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
