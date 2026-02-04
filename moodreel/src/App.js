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
import { TrailerProvider, useTrailer } from './context/TrailerContext';
import TrailerPiP from './components/TrailerPiP';
import { useUserProfile } from './hooks/useUserProfile';
import './App.css';

// Lazy load secondary routes for code-splitting
const MovieDetails = lazy(() => import('./pages/MovieDetails'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Stats = lazy(() => import('./pages/Stats'));
const MoodCalendar = lazy(() => import('./pages/MoodCalendar'));
const Achievements = lazy(() => import('./pages/Achievements'));
const SharedList = lazy(() => import('./pages/SharedList'));
const Profile = lazy(() => import('./pages/Profile'));

function AppContent() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { isSoundEnabled, toggleSounds } = useSounds();
  const { newUnlock, dismissToast, unlockedCount, totalCount } = useAchievements();
  const { activeTrailer, closeTrailer } = useTrailer();
  const { profile } = useUserProfile();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isScrolled, setIsScrolled] = useState(false);

  // Monitor scroll for header polish
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

      <AchievementToast achievement={newUnlock} onDismiss={dismissToast} />

      {/* Global Trailer PiP */}
      {activeTrailer && (
        <TrailerPiP
          videoKey={activeTrailer.videoKey}
          title={activeTrailer.title}
          onClose={closeTrailer}
        />
      )}

      {/* Keyboard Shortcuts Modal */}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Offline Indicator */}
      {isOffline && (
        <div className="offline-banner" role="alert">
          📡 You are offline. Showing cached results.
        </div>
      )}

      <header className={`App-header ${isScrolled ? 'scrolled' : ''}`}>
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
            to="/profile"
            className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
            title="My Profile"
          >
            <span className="nav-avatar">{profile.avatar}</span> Profile
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
          to="/profile"
          className={`bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">{profile.avatar}</span>
          <span className="bottom-nav-label">Profile</span>
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
            <Route path="/shared" element={<SharedList />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/share/:shareId" element={<SharedList />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/calendar" element={<MoodCalendar />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <TrailerProvider>
      <AppContent />
    </TrailerProvider>
  );
}