import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for theme management (dark/light mode)
 * Persists preference in localStorage
 */
export function useTheme() {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('moodreel-theme');
        if (saved !== null) {
            return saved === 'dark';
        }
        // Default to dark, or check system preference
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.remove('light-theme');
            root.classList.add('dark-theme');
        } else {
            root.classList.remove('dark-theme');
            root.classList.add('light-theme');
        }
        localStorage.setItem('moodreel-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggleTheme = useCallback(() => {
        setIsDark(prev => !prev);
    }, []);

    return { isDark, toggleTheme };
}

export default useTheme;
