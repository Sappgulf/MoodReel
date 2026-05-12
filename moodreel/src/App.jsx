import React, { Suspense, lazy, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Navigate, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';
import { SkeletonGrid } from './components/Skeleton';
import { useTheme } from './hooks/useTheme';
import { useSounds } from './hooks/useSounds';
import { useAchievements } from './hooks/useAchievements';
import Confetti from './components/Confetti';
import { TrailerProvider, useTrailer } from './context/TrailerContext';
import { ToastProvider, useToasts } from './context/ToastContext';
import TrailerPiP from './components/TrailerPiP';
import ToastStack from './components/ToastStack';
import { useUserProfile } from './hooks/useUserProfile';
import { useWindowSize } from './hooks/useWindowSize';
import { copyToClipboard } from './utils/clipboard';
import { safeGetJSON } from './storage/safeStorage';
import { StorageKeys as SK } from './storage/storageKeys';
import { getApiKeyStatus } from './services/apiClient';

// Lazy load secondary routes for code-splitting
const InstallPrompt = lazy(() => import('./components/InstallPrompt'));
const OnboardingModal = lazy(() => import('./components/OnboardingModal'));
const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal'));
const QuickActionsModal = lazy(() => import('./components/QuickActionsModal'));
const MovieDetails = lazy(() => import('./pages/MovieDetails'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Stats = lazy(() => import('./pages/Stats'));
const MoodCalendar = lazy(() => import('./pages/MoodCalendar'));
const Achievements = lazy(() => import('./pages/Achievements'));
const SharedList = lazy(() => import('./pages/SharedList'));
const Profile = lazy(() => import('./pages/Profile'));

const SEARCH_FALLBACK_EVENT = 'moodreel:search-fallback';
const SEARCH_FALLBACK_TOAST_COOLDOWN_MS = 12000;
const HAS_WINDOW = typeof window !== 'undefined';
const HAS_NAVIGATOR = typeof navigator !== 'undefined';
const SEARCH_FALLBACK_TOASTS = {
  'search-stale-cache': {
    title: 'Using cached results',
    message: 'Search results are coming from cached data until connectivity returns.',
    icon: '🛰️',
    variant: 'info',
  },
  'search-service-unavailable': {
    title: 'Search service unavailable',
    message: 'Live search could not be reached. Showing cached/offline behavior where possible.',
    icon: '⚠️',
    variant: 'error',
  },
  'search-no-match-fallback': {
    title: 'No exact mood match found',
    message: 'Showing trending content as a fallback for this search.',
    icon: '🔎',
    variant: 'info',
  },
};

function NotFoundPage() {
  const notFoundLinkRef = useRef(null);

  useEffect(() => {
    notFoundLinkRef.current?.focus();
  }, []);

  return (
    <section className="page-enter" aria-label="Page not found">
      <h2>Page not found</h2>
      <p>We couldn&apos;t find the page you requested.</p>
      <Link ref={notFoundLinkRef} to="/" className="primary-button">
        Return to Discover
      </Link>
    </section>
  );
}

function GuardedRoute({ children, routeKey }) {
  return (
    <ErrorBoundary variant="page" resetKey={routeKey}>
      {children}
    </ErrorBoundary>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const routePath = location.pathname;
  const { isDark, toggleTheme } = useTheme();
  const { isSoundEnabled, toggleSounds } = useSounds();
  const soundEnabled = isSoundEnabled();
  const { newUnlock, unlockedCount, totalCount } = useAchievements();
  const { activeTrailer, closeTrailer } = useTrailer();
  const { pushToast } = useToasts();
  const { width, isMobile } = useWindowSize();
  const { profile } = useUserProfile();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isOffline, setIsOffline] = useState(() => (HAS_NAVIGATOR ? !navigator.onLine : false));
  const [isScrolled, setIsScrolled] = useState(false);
  const mainRef = React.useRef(null);
  const isBottomNavCompact = isMobile && width <= 380;
  const [apiKeyStatus, setApiKeyStatus] = useState(() => getApiKeyStatus());
  const lastSearchFallbackRef = useRef({ key: '', at: 0 });

  const openQuickActions = useCallback(() => {
    setShowQuickActions(true);
  }, []);

  const quickActions = useMemo(() => {
    const focusMoodSearch = () => {
      navigate('/');
      if (!HAS_WINDOW) return;
      window.setTimeout(() => {
        if (!HAS_WINDOW) return;
        window.dispatchEvent(new CustomEvent('moodreel:focus-mood-search'));
      }, 75);
    };

    return [
      {
        id: 'discover',
        label: 'Go to Discover',
        description: 'Return to the main mood search surface.',
        shortcut: 'G D',
        onSelect: () => navigate('/'),
      },
      {
        id: 'watchlist',
        label: 'Open Watchlist',
        description: 'Review saved titles, notes, and watched items.',
        shortcut: 'G W',
        onSelect: () => navigate('/watchlist'),
      },
      {
        id: 'stats',
        label: 'Open Stats',
        description: 'Check taste trends, genres, and discovery patterns.',
        shortcut: 'G S',
        onSelect: () => navigate('/stats'),
      },
      {
        id: 'calendar',
        label: 'Open Calendar',
        description: 'See mood-search history across the last 30 days.',
        shortcut: 'G C',
        onSelect: () => navigate('/calendar'),
      },
      {
        id: 'profile',
        label: 'Open Profile',
        description: 'Update your persona, bio, and streaming region.',
        shortcut: 'G P',
        onSelect: () => navigate('/profile'),
      },
      {
        id: 'focus-mood',
        label: 'Focus Mood Search',
        description: 'Jump straight to the discovery input on Home.',
        shortcut: 'S',
        onSelect: focusMoodSearch,
      },
      {
        id: 'toggle-theme',
        label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        description: 'Change the app chrome in one tap.',
        shortcut: 'D',
        tone: 'gold',
        onSelect: toggleTheme,
      },
      {
        id: 'toggle-sound',
        label: soundEnabled ? 'Mute Sounds' : 'Unmute Sounds',
        description: 'Silence or restore feedback sounds.',
        shortcut: 'M',
        tone: 'gold',
        onSelect: toggleSounds,
      },
      {
        id: 'shortcuts',
        label: 'Show Keyboard Shortcuts',
        description: 'Open the built-in help overlay.',
        shortcut: '?',
        onSelect: () => setShowShortcuts(true),
      },
      {
        id: 'copy-link',
        label: 'Copy Current Link',
        description: 'Share the current MoodReel state.',
        shortcut: '⌘ C',
        onSelect: async () => {
          try {
            await copyToClipboard(HAS_WINDOW ? window.location.href : '');
            pushToast({
              icon: '🔗',
              title: 'Link copied',
              message: 'Current view copied to clipboard.',
              duration: 2600,
            });
          } catch {
            pushToast({
              icon: '⚠️',
              title: 'Copy failed',
              message: 'Clipboard access was blocked by the browser.',
              variant: 'error',
              duration: 4000,
            });
          }
        },
      },
    ];
  }, [isDark, navigate, pushToast, soundEnabled, toggleSounds, toggleTheme]);

  const isOverlayOpen = useMemo(
    () => showShortcuts || showQuickActions,
    [showShortcuts, showQuickActions]
  );

  const setDocumentTitle = useCallback(path => {
    let title = 'MoodReel';
    if (path === '/') title = 'Discover | MoodReel';
    else if (path === '/watchlist') title = 'Watchlist & Favorites | MoodReel';
    else if (/^\/(movie|tv)\/[^/]+/.test(path)) title = 'Movie & TV Details | MoodReel';
    else if (path === '/shared' || path.startsWith('/share/')) title = 'Shared List | MoodReel';
    else if (path === '/achievements') title = 'Achievements | MoodReel';
    else if (path === '/profile') title = 'Profile | MoodReel';
    else if (path === '/stats') title = 'Your Stats | MoodReel';
    else if (path === '/calendar') title = 'Mood Calendar | MoodReel';
    else if (path === '/not-found' || path === '/404') title = 'Page not found | MoodReel';
    return title;
  }, []);

  const documentTitle = useMemo(
    () => setDocumentTitle(location.pathname),
    [location.pathname, setDocumentTitle]
  );
  const offlineSummary = useMemo(() => {
    if (!isOffline) return null;
    return {
      watchlistCount: safeGetJSON(SK.WATCHLIST, []).length,
      vibesCount: safeGetJSON(SK.CUSTOM_PLAYLISTS, []).length,
    };
  }, [isOffline]);

  const announceSearchFallback = useCallback(
    event => {
      const detail = event?.detail || {};
      const type = detail.type;
      const template = SEARCH_FALLBACK_TOASTS[type];
      const query = (detail.query || '').trim();
      const now = Date.now();
      const key = `${type}|${query}`;

      if (!template) return;
      if (
        lastSearchFallbackRef.current.key === key &&
        now - lastSearchFallbackRef.current.at < SEARCH_FALLBACK_TOAST_COOLDOWN_MS
      )
        return;

      lastSearchFallbackRef.current = { key, at: now };

      const hasQuery = query.length > 0;
      const message = hasQuery ? `${template.message} (“${query}”)` : template.message;

      pushToast({
        icon: template.icon,
        title: template.title,
        message,
        variant: template.variant,
        duration: 5000,
      });
    },
    [pushToast]
  );

  // Keep API-key status in sync with profile edits in the same tab.
  useEffect(() => {
    if (!HAS_WINDOW) return;
    setApiKeyStatus(getApiKeyStatus());
  }, [routePath]);

  useEffect(() => {
    if (!HAS_WINDOW) return;

    const handleApiKeyUpdate = () => {
      setApiKeyStatus(getApiKeyStatus());
    };

    const handleStorage = () => {
      handleApiKeyUpdate();
    };

    window.addEventListener('moodreel:api-key-updated', handleApiKeyUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('moodreel:api-key-updated', handleApiKeyUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!HAS_WINDOW) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Monitor online status
  useEffect(() => {
    if (!HAS_WINDOW) return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Report search fallback events from searchService
  useEffect(() => {
    if (!HAS_WINDOW) return;

    window.addEventListener(SEARCH_FALLBACK_EVENT, announceSearchFallback);

    return () => {
      window.removeEventListener(SEARCH_FALLBACK_EVENT, announceSearchFallback);
    };
  }, [announceSearchFallback]);

  // Scroll to top on page navigation
  useEffect(() => {
    const reduceMotion = HAS_WINDOW
      ? window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      : false;
    if (!HAS_WINDOW) return;

    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    requestAnimationFrame(() => {
      mainRef.current?.focus?.({ preventScroll: true });
    });
  }, [routePath]);

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  useEffect(() => {
    if (!HAS_WINDOW || !('serviceWorker' in navigator) || import.meta.env.DEV) return;

    let refreshing = false;

    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        const notifyUpdate = waitingWorker => {
          if (!waitingWorker) return;
          pushToast({
            icon: '⬆️',
            title: 'Update ready',
            message:
              'Fresh polish is available: offline shell, smarter shuffle, and data controls.',
            duration: 0,
            action: {
              label: 'Reload',
              onClick: () => waitingWorker.postMessage({ type: 'SKIP_WAITING' }),
            },
          });
        };

        notifyUpdate(registration.waiting);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              notifyUpdate(newWorker);
            }
          });
        });
      })
      .catch(() => {
        // PWA registration is progressive enhancement.
      });

    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [pushToast]);

  // Global keyboard shortcuts
  useEffect(() => {
    if (!HAS_WINDOW) return;

    const handleKeyDown = e => {
      const target = e.target;
      const targetTag = target?.tagName;
      const isEditable =
        targetTag === 'INPUT' ||
        targetTag === 'TEXTAREA' ||
        targetTag === 'SELECT' ||
        target?.isContentEditable;
      const isInDialog =
        target?.closest?.('[data-app-modal]') ||
        target?.closest?.('[role="dialog"]') ||
        target?.closest?.('[aria-modal="true"]');
      const key = typeof e.key === 'string' ? e.key.toLowerCase() : '';

      if (key === 'escape' && (showShortcuts || showQuickActions)) {
        e.preventDefault();
        setShowShortcuts(false);
        setShowQuickActions(false);
        return;
      }

      if (e.defaultPrevented || e.isComposing || isInDialog || isOverlayOpen) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && !e.altKey && key === 'k') {
        e.preventDefault();
        openQuickActions();
        return;
      }
      // ? = show shortcuts
      const isShortcutHelpKey = key === '?' || (key === '/' && e.shiftKey);
      if (
        !isEditable &&
        !isOverlayOpen &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        isShortcutHelpKey
      ) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      // D = toggle dark mode
      if (!isEditable && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && key === 'd') {
        toggleTheme();
      }
      // M = toggle sounds
      if (!isEditable && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && key === 'm') {
        toggleSounds();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOverlayOpen, openQuickActions, showQuickActions, showShortcuts, toggleSounds, toggleTheme]);

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
      duration: 4000,
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

      <Suspense fallback={null}>
        {/* PWA Install Prompt */}
        <InstallPrompt />

        {/* Onboarding for first-time users */}
        <OnboardingModal />

        {/* Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
        <QuickActionsModal
          isOpen={showQuickActions}
          onClose={() => setShowQuickActions(false)}
          actions={quickActions}
        />
      </Suspense>
      <ToastStack />

      {/* Global Trailer PiP */}
      {activeTrailer && (
        <TrailerPiP
          videoKey={activeTrailer.videoKey}
          title={activeTrailer.title}
          onClose={closeTrailer}
        />
      )}

      {/* Offline Indicator */}
      {isOffline && (
        <div className="offline-banner" role="status" aria-live="polite">
          <span>📡 Offline mode</span>
          <p>
            Saved shell ready: {offlineSummary?.watchlistCount || 0} watchlist titles and{' '}
            {offlineSummary?.vibesCount || 0} saved vibes are still available.
          </p>
          <div className="offline-actions">
            <Link to="/watchlist">Open Watchlist</Link>
            <Link to="/profile">Data Settings</Link>
          </div>
        </div>
      )}
      {!apiKeyStatus.configured && (
        <div className="offline-banner" role="status" aria-live="polite">
          <span>🔐 API key needed</span>
          <p>TMDB access requires an API key to load catalog data.</p>
          <div className="offline-actions">
            <Link to="/profile">Set a local key in Profile</Link>
          </div>
        </div>
      )}

      <header
        className={`App-header ${isScrolled ? 'scrolled' : ''}`}
        aria-label="Main navigation and controls"
      >
        <div className="header-top">
          <Link to="/" className="logo-link">
            <h1>
              <span className="logo-mark" aria-hidden="true">
                <img src="/moodreel-logo.png" alt="" />
              </span>
              <span className="logo-wordmark">MoodReel</span>
            </h1>
          </Link>
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

        <nav className="nav-links desktop-nav" aria-label="Primary navigation">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            aria-current={location.pathname === '/' ? 'page' : undefined}
          >
            🎬 Discover
          </Link>
          <Link
            to="/watchlist"
            className={`nav-link ${location.pathname === '/watchlist' ? 'active' : ''}`}
            aria-current={location.pathname === '/watchlist' ? 'page' : undefined}
          >
            ❤️ Watchlist
          </Link>
          <Link
            to="/achievements"
            className={`nav-link ${location.pathname === '/achievements' ? 'active' : ''}`}
            aria-current={location.pathname === '/achievements' ? 'page' : undefined}
          >
            🏆 {unlockedCount}/{totalCount}
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
            title="My Profile"
            aria-current={location.pathname === '/profile' ? 'page' : undefined}
          >
            <span className="nav-avatar">{profile.avatar}</span> Profile
          </Link>
          <Link
            to="/stats"
            className={`nav-link ${location.pathname === '/stats' ? 'active' : ''}`}
            aria-current={location.pathname === '/stats' ? 'page' : undefined}
          >
            📊 Stats
          </Link>
          <Link
            to="/calendar"
            className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}
            aria-current={location.pathname === '/calendar' ? 'page' : undefined}
          >
            📅 Calendar
          </Link>
        </nav>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        className={`mobile-bottom-nav ${isBottomNavCompact ? 'compact' : ''}`}
        aria-label="Primary navigation"
      >
        <Link
          to="/"
          className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}
          aria-current={location.pathname === '/' ? 'page' : undefined}
        >
          <span className="bottom-nav-icon">🎬</span>
          <span className="bottom-nav-label">Discover</span>
        </Link>
        <Link
          to="/watchlist"
          className={`bottom-nav-item ${location.pathname === '/watchlist' ? 'active' : ''}`}
          aria-current={location.pathname === '/watchlist' ? 'page' : undefined}
        >
          <span className="bottom-nav-icon">❤️</span>
          <span className="bottom-nav-label">Watchlist</span>
        </Link>
        <Link
          to="/profile"
          className={`bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
          aria-current={location.pathname === '/profile' ? 'page' : undefined}
        >
          <span className="bottom-nav-icon">{profile.avatar}</span>
          <span className="bottom-nav-label">Profile</span>
        </Link>
        <Link
          to="/stats"
          className={`bottom-nav-item ${location.pathname === '/stats' ? 'active' : ''}`}
          aria-current={location.pathname === '/stats' ? 'page' : undefined}
        >
          <span className="bottom-nav-icon">📊</span>
          <span className="bottom-nav-label">Stats</span>
        </Link>
        <Link
          to="/calendar"
          className={`bottom-nav-item ${location.pathname === '/calendar' ? 'active' : ''}`}
          aria-current={location.pathname === '/calendar' ? 'page' : undefined}
        >
          <span className="bottom-nav-icon">📅</span>
          <span className="bottom-nav-label">Calendar</span>
        </Link>
      </nav>

      <ErrorBoundary>
        <main
          id="main-content"
          ref={mainRef}
          className="app-main"
          tabIndex={-1}
          role="main"
          aria-label={documentTitle}
        >
          <Suspense fallback={<SkeletonGrid count={8} />}>
            <Routes>
              <Route
                path="/"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <Home />
                  </GuardedRoute>
                }
              />
              <Route path="/movie" element={<Navigate to="/" replace />} />
              <Route path="/tv" element={<Navigate to="/" replace />} />
              <Route
                path="/movie/:id"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <MovieDetails />
                  </GuardedRoute>
                }
              />
              <Route
                path="/tv/:id"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <MovieDetails />
                  </GuardedRoute>
                }
              />
              <Route
                path="/watchlist"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <Watchlist />
                  </GuardedRoute>
                }
              />
              <Route
                path="/shared"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <SharedList />
                  </GuardedRoute>
                }
              />
              <Route
                path="/achievements"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <Achievements />
                  </GuardedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <Profile />
                  </GuardedRoute>
                }
              />
              <Route
                path="/share/:shareId"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <SharedList />
                  </GuardedRoute>
                }
              />
              <Route
                path="/stats"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <Stats />
                  </GuardedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <MoodCalendar />
                  </GuardedRoute>
                }
              />
              <Route
                path="/404"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <NotFoundPage />
                  </GuardedRoute>
                }
              />
              <Route
                path="/not-found"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <NotFoundPage />
                  </GuardedRoute>
                }
              />
              <Route
                path="*"
                element={
                  <GuardedRoute routeKey={routePath}>
                    <NotFoundPage />
                  </GuardedRoute>
                }
              />
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
