import React from 'react';
import { Link } from 'react-router-dom';
import { useWatchlist } from '../hooks/useWatchlist';
import MovieCard from '../components/MovieCard';

/**
 * Watchlist page showing saved movies
 */
function Watchlist() {
    const { watchlist, toggleWatchlist, isInWatchlist } = useWatchlist();

    // Sort by most recently added
    const sortedWatchlist = [...watchlist].sort((a, b) => b.addedAt - a.addedAt);

    return (
        <div className="watchlist-page">
            <h2>My Watchlist</h2>

            {sortedWatchlist.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🎬</div>
                    <h3>Your watchlist is empty</h3>
                    <p>Start adding movies and shows you want to watch!</p>
                    <Link to="/" className="primary-button">
                        Discover Movies
                    </Link>
                </div>
            ) : (
                <>
                    <p style={{
                        textAlign: 'center',
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--spacing-xl)'
                    }}>
                        {sortedWatchlist.length} {sortedWatchlist.length === 1 ? 'item' : 'items'} saved
                    </p>
                    <div className="recommendations">
                        {sortedWatchlist.map((item) => (
                            <MovieCard
                                key={item.id}
                                movie={item}
                                isInWatchlist={isInWatchlist(item.id)}
                                onToggleWatchlist={toggleWatchlist}
                                mediaType={item.media_type}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default Watchlist;
