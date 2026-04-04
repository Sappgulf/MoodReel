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
 * Skeleton for the discovery hero surface
 */
export function DiscoveryHeroSkeleton() {
    return (
        <section className="discovery-hero discovery-hero-skeleton" aria-hidden="true">
            <div className="discovery-hero-copy">
                <div className="skeleton skeleton-kicker" />
                <div className="skeleton skeleton-hero-title" />
                <div className="skeleton skeleton-hero-copy-line" />
                <div className="skeleton skeleton-hero-copy-line short" />
                <div className="skeleton hero-proof-chip" />
                <div className="hero-actions hero-actions-skeleton">
                    <div className="skeleton skeleton-button" />
                    <div className="skeleton skeleton-button secondary" />
                </div>
            </div>
            <div className="discovery-hero-visual">
                <div className="hero-featured-card hero-featured-card-skeleton">
                    <div className="skeleton hero-featured-art-skeleton" />
                    <div className="hero-featured-copy">
                        <div className="skeleton skeleton-hero-eyebrow" />
                        <div className="skeleton skeleton-hero-card-title" />
                        <div className="skeleton skeleton-hero-copy-line" />
                    </div>
                </div>
            </div>
        </section>
    );
}

/**
 * Grid of skeleton cards for loading state
 */
export function SkeletonGrid({ count = 8, layout = 'grid' }) {
    return (
        <div className={`recommendations ${layout === 'list' ? 'recommendations-list' : ''}`}>
            {Array.from({ length: count }).map((_, i) => (
                <MovieCardSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * Skeleton for text lines
 */
export function TextSkeleton({ lines = 3, lastLineWidth = '60%' }) {
    return (
        <div className="skeleton-text-lines">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton"
                    style={{
                        height: '14px',
                        width: i === lines - 1 ? lastLineWidth : '100%',
                        marginBottom: i < lines - 1 ? '8px' : 0
                    }}
                />
            ))}
        </div>
    );
}

/**
 * Skeleton for profile/avatar
 */
export function ProfileSkeleton() {
    return (
        <div className="skeleton-profile">
            <div className="skeleton-avatar skeleton" />
            <div className="skeleton-profile-info">
                <div className="skeleton" style={{ height: '20px', width: '60%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '14px', width: '40%' }} />
            </div>
        </div>
    );
}

/**
 * Skeleton for stat cards
 */
export function StatCardSkeleton() {
    return (
        <div className="skeleton-stat-card">
            <div className="skeleton" style={{ height: '32px', width: '50%', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '14px', width: '70%' }} />
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
