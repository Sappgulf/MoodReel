import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { useWatchlist } from '../hooks/useWatchlist';
import { decodeSharePayload } from '../utils/clipboard';

/**
 * Shared Watchlist View
 * Displays a watchlist shared via URL parameter
 */
function SharedList() {
    const [searchParams] = useSearchParams();
    const [sharedItems, setSharedItems] = useState([]);
    const [sharedBy, setSharedBy] = useState('');
    const [error, setError] = useState('');
    const { isInWatchlist, toggleWatchlist, isWatched, toggleWatched } = useWatchlist();

    useEffect(() => {
        const data = searchParams.get('data');
        if (!data) {
            setError('No shared list found in URL');
            return;
        }

        try {
            const decodedList = decodeSharePayload(data);

            if (decodedList.items && Array.isArray(decodedList.items)) {
                setSharedItems(decodedList.items);
                setSharedBy(decodedList.sharedBy || 'A friend');
            } else {
                setError('Invalid list format');
            }
        } catch (e) {
            console.error('Error parsing shared list:', e);
            setError('Could not decode shared list');
        }
    }, [searchParams]);

    if (error) {
        return (
            <div className="shared-list-page">
                <div className="shared-error">
                    <h2>😕 Oops!</h2>
                    <p>{error}</p>
                    <Link to="/" className="primary-button">Go to Discover</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="shared-list-page">
            <Link to="/" className="back-button">← Back to Discover</Link>

            <div className="shared-header">
                <h2>🎬 {sharedBy}'s Watchlist</h2>
                <p className="shared-subtitle">
                    {sharedItems.length} {sharedItems.length === 1 ? 'title' : 'titles'} shared with you
                </p>
            </div>

            <div className="shared-info-banner">
                <span>💡</span>
                <p>Click the heart on any movie to add it to your own watchlist!</p>
            </div>

            {sharedItems.length > 0 ? (
                <div className="recommendations shared-grid">
                    {sharedItems.map(movie => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            isInWatchlist={isInWatchlist(movie.id)}
                            onToggleWatchlist={toggleWatchlist}
                            isWatched={isWatched(movie.id)}
                            onToggleWatched={toggleWatched}
                            mediaType={movie.media_type || 'movie'}
                        />
                    ))}
                </div>
            ) : (
                <p className="loading-text">Loading shared list...</p>
            )}
        </div>
    );
}

export default SharedList;
