import React from 'react';

/**
 * Skeleton loading component for movie cards
 */
export function MovieCardSkeleton() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-poster skeleton" />
            <div className="skeleton-content">
                <div className="skeleton-title skeleton" />
                <div className="skeleton-text skeleton" />
            </div>
        </div>
    );
}

/**
 * Grid of skeleton cards for loading state
 */
export function SkeletonGrid({ count = 8 }) {
    return (
        <div className="recommendations">
            {Array.from({ length: count }).map((_, i) => (
                <MovieCardSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * General purpose skeleton for text/content
 */
export function Skeleton({ width = '100%', height = '1rem', style = {} }) {
    return (
        <div
            className="skeleton"
            style={{
                width,
                height,
                ...style
            }}
        />
    );
}

export default Skeleton;
