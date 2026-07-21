import React from 'react';
import { Wallet, Star, Users, Zap } from 'lucide-react';
import PlayerSilhouette from '@shared/components/PlayerSilhouette/PlayerSilhouette';
import './AchievementsGrid.css';

const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.charAt(0) !== '#') return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

export default function AchievementCard({ type, data }) {
    if (!data) return null;

    if (type === 'highestSpender') {
        const { name, color, spent, budget, utilization } = data;
        return (
            <div className="achievement-card">
                <div className="achievement-card__icon gold">
                    <Wallet className="w-6 h-6" />
                </div>
                <div className="achievement-card__type">Highest Spender</div>
                <div className="achievement-card__title">{name}</div>
                <div className="achievement-card__value gold font-mono">₹{spent}L</div>

                <div className="achievement-card__progress-bg">
                    <div
                        className="achievement-card__progress-fill"
                        style={{ width: `${utilization}%`, backgroundColor: color || '#EAB308' }}
                    ></div>
                </div>
            </div>
        );
    }

    if (type === 'mostExpensivePlayer') {
        const { name, role, price, teamName, teamColor } = data;
        return (
            <div className="achievement-card">
                <div className="achievement-card__silhouette-bg">
                    <PlayerSilhouette role={role} />
                </div>
                <div className="achievement-card__icon blue">
                    <Star className="w-6 h-6" />
                </div>
                <div className="achievement-card__type">Most Expensive Player</div>
                <div className="achievement-card__title">{name}</div>
                
                <div className="achievement-card__light-meta">
                    <span className="sold-role font-mono">{role}</span>
                    <span
                        className="sold-team-badge"
                        style={{
                            backgroundColor: teamColor || '#3B82F6',
                            color: getContrastColor(teamColor)
                        }}
                    >
                        {teamName}
                    </span>
                </div>

                <div className="achievement-card__value blue font-mono">
                    ₹{price}L
                </div>
            </div>
        );
    }

    if (type === 'largestSquad') {
        const { name, squadCount } = data;
        return (
            <div className="achievement-card">
                <div className="achievement-card__icon purple">
                    <Users className="w-6 h-6" />
                </div>
                <div className="achievement-card__type">Largest Squad</div>
                <div className="achievement-card__title">{name}</div>
                <div className="achievement-card__value purple">{squadCount} Players</div>
            </div>
        );
    }

    if (type === 'mostActiveTeam') {
        const { name, playersBought } = data;
        return (
            <div className="achievement-card">
                <div className="achievement-card__icon green">
                    <Zap className="w-6 h-6" />
                </div>
                <div className="achievement-card__type">Most Active Team</div>
                <div className="achievement-card__title">{name}</div>
                <div className="achievement-card__value green">{playersBought} Players Acquired</div>
            </div>
        );
    }

    return null;
}
