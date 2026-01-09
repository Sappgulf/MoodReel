import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';
import { SkeletonGrid } from './components/Skeleton';
import { useTheme } from './hooks/useTheme';
import { useSounds } from './hooks/useSounds';
import { useAchievements } from './hooks/useAchievements';
import AchievementToast from './components/AchievementToast';
import InstallPrompt from './components/InstallPrompt';
import Confetti from './components/Confetti';
import OnboardingModal from './components/OnboardingModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import './App.css';

// Lazy load secondary routes for code-splitting
const MovieDetails = lazy(() => import('./pages/MovieDetails'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Stats = lazy(() => import('./pages/Stats'));
const MoodCalendar = lazy(() => import('./pages/MoodCalendar'));
const Achievements = lazy(() => import('./pages/Achievements'));

function App() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { isSoundEnabled, toggleSounds } = useSounds();
  const { newUnlock, dismissToast, unlockedCount, totalCount } = useAchievements();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Scroll to top on page navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ? = show shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      // D = toggle dark mode
      if (e.key === 'd' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        toggleTheme();
      }
      // M = toggle sounds
      if (e.key === 'm' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        toggleSounds();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme, toggleSounds]);

  // Trigger confetti on achievement unlock
  useEffect(() => {
    if (newUnlock) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [newUnlock]);

  return (
    <div className="App">
      {/* Confetti celebration */}
      <Confetti active={showConfetti} />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Onboarding for first-time users */}
      <OnboardingModal />

      {/* Achievement Toast */}
      <AchievementToast achievement={newUnlock} onDismiss={dismissToast} />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      <header className="App-header">
        <div className="header-top">
          <Link to="/" className="logo-link"><h1>🎬 MoodReel</h1></Link>
          <div className="header-controls">
            <button
              className="shortcuts-btn"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (?)"
            >
              ⌨️
            </button>
            <button
              className="sound-toggle"
              onClick={toggleSounds}
              aria-label={`${isSoundEnabled() ? 'Mute' : 'Unmute'} sounds`}
              title={`${isSoundEnabled() ? 'Mute' : 'Unmute'} sounds`}
            >
              {isSoundEnabled() ? '🔊' : '🔇'}
            </button>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        <p>Discover films that match your mood</p>

        <nav className="nav-links desktop-nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            🎬 Discover
          </Link>
          <Link
            to="/watchlist"
            className={`nav-link ${location.pathname === '/watchlist' ? 'active' : ''}`}
          >
            ❤️ Watchlist
          </Link>
          <Link
            to="/achievements"
            className={`nav-link ${location.pathname === '/achievements' ? 'active' : ''}`}
          >
            🏆 {unlockedCount}/{totalCount}
          </Link>
          <Link
            to="/stats"
            className={`nav-link ${location.pathname === '/stats' ? 'active' : ''}`}
          >
            📊 Stats
          </Link>
          <Link
            to="/calendar"
            className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}
          >
            📅 Calendar
          </Link>
        </nav>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <Link
          to="/"
          className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">🎬</span>
          <span className="bottom-nav-label">Discover</span>
        </Link>
        <Link
          to="/watchlist"
          className={`bottom-nav-item ${location.pathname === '/watchlist' ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">❤️</span>
          <span className="bottom-nav-label">Watchlist</span>
        </Link>
        <Link
          to="/achievements"
          className={`bottom-nav-item ${location.pathname === '/achievements' ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">🏆</span>
          <span className="bottom-nav-label">{unlockedCount}/{totalCount}</span>
        </Link>
        <Link
          to="/stats"
          className={`bottom-nav-item ${location.pathname === '/stats' ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">📊</span>
          <span className="bottom-nav-label">Stats</span>
        </Link>
        <Link
          to="/calendar"
          className={`bottom-nav-item ${location.pathname === '/calendar' ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">📅</span>
          <span className="bottom-nav-label">Calendar</span>
        </Link>
      </nav>

      <ErrorBoundary>
        <Suspense fallback={<main><SkeletonGrid count={8} /></main>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/tv/:id" element={<MovieDetails />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/calendar" element={<MoodCalendar />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;