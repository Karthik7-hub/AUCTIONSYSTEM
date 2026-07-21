import React from 'react';
import './ResultsSkeleton.css';

export default function ResultsSkeleton() {
    return (
        <div className="results-skeleton">
            {/* Hero Skeleton */}
            <div className="skeleton-card hero-skeleton">
                <div className="skeleton-circle trophy-skel"></div>
                <div className="skeleton-line title-skel"></div>
                <div className="skeleton-line sub-skel"></div>
                <div className="skeleton-bar stats-bar-skel"></div>
            </div>

            {/* Achievements Grid Skeleton */}
            <div className="skeleton-grid">
                <div className="skeleton-card ach-skel"></div>
                <div className="skeleton-card ach-skel"></div>
                <div className="skeleton-card ach-skel"></div>
                <div className="skeleton-card ach-skel"></div>
            </div>

            {/* Top Purchases Skeleton */}
            <div className="skeleton-card list-skeleton">
                <div className="skeleton-line header-skel"></div>
                <div className="skeleton-row"></div>
                <div className="skeleton-row"></div>
                <div className="skeleton-row"></div>
            </div>
        </div>
    );
}
