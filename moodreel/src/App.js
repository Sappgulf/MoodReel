import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';
import { SkeletonGrid } from './components/Skeleton';
import { useTheme } from './hooks/useTheme';
import { useSounds } from './hooks/useSounds';
import { useAchievements } from './hooks/useAchievements';
import AchievementToast from './components/AchievementToast';
import InstallPrompt from './components/InstallPrompt';
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

  return (
    <div className="App">
      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Achievement Toast */}
      <AchievementToast achievement={newUnlock} onDismiss={dismissToast} />

      <header className="App-header">
        <div className="header-top">
          <Link to="/" className="logo-link"><h1>🎬 MoodReel</h1></Link>
          <div className="header-controls">
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

        <nav className="nav-links">
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