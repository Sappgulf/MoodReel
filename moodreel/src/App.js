import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';
import { SkeletonGrid } from './components/Skeleton';
import './App.css';

// Lazy load secondary routes for code-splitting
const MovieDetails = lazy(() => import('./pages/MovieDetails'));
const Watchlist = lazy(() => import('./pages/Watchlist'));

function App() {
  const location = useLocation();

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎬 MoodReel</h1>
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
        </nav>
      </header>

      <ErrorBoundary>
        <Suspense fallback={<main><SkeletonGrid count={8} /></main>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/tv/:id" element={<MovieDetails />} />
            <Route path="/watchlist" element={<Watchlist />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;