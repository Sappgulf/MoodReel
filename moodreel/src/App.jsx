import React, { Suspense, lazy, useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';
import { SkeletonGrid } from './components/Skeleton';
import { useTheme } from './hooks/useTheme';
import { useSounds } from './hooks/useSounds';
import { useAchievements } from './hooks/useAchievements';
import InstallPrompt from './components/InstallPrompt';
import Confetti from './components/Confetti';
import OnboardingModal from './components/OnboardingModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import QuickActionsModal from './components/QuickActionsModal';
import { TrailerProvider, useTrailer } from './context/TrailerContext';
import { ToastProvider, useToasts } from './context/ToastContext';
import TrailerPiP from './components/TrailerPiP';
import ToastStack from './components/ToastStack';
import { useUserProfile } from './hooks/useUserProfile';
import { copyToClipboard } from './utils/clipboard';
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
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { isSoundEnabled, toggleSounds } = useSounds();
  const soundEnabled = isSoundEnabled();
  const { newUnlock, unlockedCount, totalCount } = useAchievements();
  const { activeTrailer, closeTrailer } = useTrailer();
  const { pushToast } = useToasts();
  const { profile } = useUserProfile();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isScrolled, setIsScrolled] = useState(false);

  const openQuickActions = useCallback(() => {
    setShowQuickActions(true);
  }, []);

  const quickActions = useMemo(() => {
    const focusMoodSearch = () => {
      navigate('/');
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('moodreel:focus-mood-search'));
      }, 75);
    };

    return [
      {
        id: 'discover',
        label: 'Go to Discover',
        description: 'Return to the main mood search surface.',
        shortcut: 'G D',
        onSelect: () => navigate('/')
      },
      {
        id: 'watchlist',
        label: 'Open Watchlist',
        description: 'Review saved titles, notes, and watched items.',
        shortcut: 'G W',
        onSelect: () => navigate('/watchlist')
      },
      {
        id: 'stats',
        label: 'Open Stats',
        description: 'Check taste trends, genres, and discovery patterns.',
        shortcut: 'G S',
        onSelect: () => navigate('/stats')
      },
      {
        id: 'calendar',
        label: 'Open Calendar',
        description: 'See mood-search history across the last 30 days.',
        shortcut: 'G C',
        onSelect: () => navigate('/calendar')
      },
      {
        id: 'profile',
        label: 'Open Profile',
        description: 'Update your persona, bio, and streaming region.',
        shortcut: 'G P',
        onSelect: () => navigate('/profile')
      },
      {
        id: 'focus-mood',
        label: 'Focus Mood Search',
        description: 'Jump straight to the discovery input on Home.',
        shortcut: 'S',
        onSelect: focusMoodSearch
      },
      {
        id: 'toggle-theme',
        label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        description: 'Change the app chrome in one tap.',
        shortcut: 'D',
        tone: 'gold',
        onSelect: toggleTheme
      },
      {
        id: 'toggle-sound',
        label: soundEnabled ? 'Mute Sounds' : 'Unmute Sounds',
        description: 'Silence or restore feedback sounds.',
        shortcut: 'M',
        tone: 'gold',
        onSelect: toggleSounds
      },
      {
        id: 'shortcuts',
        label: 'Show Keyboard Shortcuts',
        description: 'Open the built-in help overlay.',
        shortcut: '?',
        onSelect: () => setShowShortcuts(true)
      },
      {
        id: 'copy-link',
        label: 'Copy Current Link',
        description: 'Share the current MoodReel state.',
        shortcut: '⌘ C',
        onSelect: async () => {
          try {
            await copyToClipboard(window.location.href);
            pushToast({
              icon: '🔗',
              title: 'Link copied',
              message: 'Current view copied to clipboard.',
              duration: 2600
            });
          } catch (err) {
            pushToast({
              icon: '⚠️',
              title: 'Copy failed',
              message: 'Clipboard access was blocked by the browser.',
              variant: 'error',
              duration: 4000
            });
          }
        }
      }
    ];
  }, [isDark, navigate, pushToast, soundEnabled, toggleSounds, toggleTheme]);

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
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

    // Update document title for accessibility
    const path = location.pathname;
    let title = 'MoodReel';
    if (path === '/') title = 'Discover | MoodReel';
    else if (path === '/watchlist') title = 'Watchlist & Favorites | MoodReel';
    else if (path === '/achievements') title = 'Achievements | MoodReel';
    else if (path === '/profile') title = 'Profile | MoodReel';
    else if (path === '/stats') title = 'Your Stats | MoodReel';
    else if (path === '/calendar') title = 'Mood Calendar | MoodReel';

    document.title = title;
  }, [location.pathname]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openQuickActions();
        return;
      }
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
  }, [openQuickActions, toggleTheme, toggleSounds]);

  // Trigger confetti on achievement unlock
  useEffect(() => {
    if (newUnlock) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [newUnlock]);

  // Show achievement toast in global toast stack
  useEffect(() => {
    if (!newUnlock) return;
    pushToast({
      icon: newUnlock.icon,
      label: 'Achievement Unlocked',
      title: newUnlock.title,
      message: newUnlock.description,
      variant: 'achievement',
      duration: 4000
    });
  }, [newUnlock, pushToast]);

  return (
    <div className="App">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      {/* Keep the atmosphere lightweight; avoid full-screen dimming layers. */}
      <div className="film-grain" aria-hidden="true" />

      {/* Confetti celebration */}
      <Confetti active={showConfetti} />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Onboarding for first-time users */}
      <OnboardingModal />
      <ToastStack />

      {/* Global Trailer PiP */}
      {activeTrailer && (
        <TrailerPiP
          videoKey={activeTrailer.videoKey}
          title={activeTrailer.title}
          onClose={closeTrailer}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
      <QuickActionsModal
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        actions={quickActions}
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
              className="quick-actions-btn"
              type="button"
              onClick={openQuickActions}
              title="Quick actions (⌘K)"
              aria-label="Open quick actions"
            >
              ⌘K
            </button>
            <button
              className="shortcuts-btn"
              type="button"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (?)"
              aria-label="Keyboard shortcuts"
            >
              ⌨️
            </button>
            <button
              className="sound-toggle"
              type="button"
              onClick={toggleSounds}
              aria-label={`${soundEnabled ? 'Mute' : 'Unmute'} sounds`}
              title={`${soundEnabled ? 'Mute' : 'Unmute'} sounds`}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <button
              className="theme-toggle"
              type="button"
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
        <main id="main-content" className="app-main">
          <Suspense fallback={<SkeletonGrid count={8} />}>
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
        </main>
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <TrailerProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </TrailerProvider>
  );
}
