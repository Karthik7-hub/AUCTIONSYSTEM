import React from 'react';
import { Trophy } from 'lucide-react';
import './HeroSection.css';

export default function HeroSection({ hero }) {
    const { title, totalPlayers, totalSpent, totalTeams, unsoldCount, avgValue } = hero || {};

    return (
        <div className="results-hero">
            <div className="results-hero__glow"></div>

            <div className="results-hero__trophy">
                <Trophy className="w-12 h-12 text-yellow-400" />
            </div>

            <h1 className="results-hero__title">{title || 'Auction Completed'}</h1>
            <p className="results-hero__subtitle">All franchises have finalized their squads</p>

            <div className="results-hero__stats font-mono">
                <div className="hero-stat">
                    <span className="hero-stat__val">{totalPlayers || 0}</span>
                    <span className="hero-stat__lbl">Players Sold</span>
                </div>
                <div className="hero-stat-sep"></div>
                <div className="hero-stat">
                    <span className="hero-stat__val gold">₹{totalSpent || 0}L</span>
                    <span className="hero-stat__lbl">Total Spent</span>
                </div>
                <div className="hero-stat-sep"></div>
                <div className="hero-stat">
                    <span className="hero-stat__val">{totalTeams || 0}</span>
                    <span className="hero-stat__lbl">Teams</span>
                </div>
            </div>

            <div className="results-hero__subtext">
                <span>{unsoldCount || 0} Unsold</span>
                <span>•</span>
                <span>Avg ₹{avgValue || 0}L / Player</span>
            </div>
        </div>
    );
}
