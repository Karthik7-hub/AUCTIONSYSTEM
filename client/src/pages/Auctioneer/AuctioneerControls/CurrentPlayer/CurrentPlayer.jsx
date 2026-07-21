import React from 'react';
import { User } from 'lucide-react';
import Badge from '@shared/components/Badge';
import './CurrentPlayer.css';

export default function CurrentPlayer({ currentPlayer, liveState, teams }) {
    if (!currentPlayer) return null;

    const leadingTeam = teams.find(t => t._id === liveState.leadingTeamId);

    return (
        <div className="player-card">
            <div className="player-card__profile">
                <div className="player-card__avatar">
                    <User className="w-6 h-6 player-card__avatar-icon" />
                </div>
                <div className="player-card__details">
                    <h1 className="player-card__name">{currentPlayer.name}</h1>
                    <div className="player-card__meta">
                        <Badge>{currentPlayer.role}</Badge>
                        <Badge>{currentPlayer.category}</Badge>
                        <Badge variant="info">Base: ₹{currentPlayer.basePrice}L</Badge>
                    </div>
                </div>
            </div>

            <div className="player-card__bid-wrapper">
                <div className="player-card__bid-col">
                    <div className="player-card__bid-label">Current Bid</div>
                    <div className="font-mono player-card__bid-value">₹{liveState.currentBid}L</div>
                </div>
                {liveState.leadingTeamId && (
                    <div className="player-card__leader-col">
                        <div className="player-card__leader-label">Leader</div>
                        <div className="player-card__leader-name">
                            {leadingTeam?.name}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
