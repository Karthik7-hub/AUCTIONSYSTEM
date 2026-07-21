import React, { useState } from 'react';
import { Award } from 'lucide-react';
import BidHistoryModal from '../../../ActivityPanel/BidHistoryModal';
import './TopPurchases.css';

const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.charAt(0) !== '#') return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

export default function TopPurchases({ topPurchases, teamMap }) {
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    if (!topPurchases || topPurchases.length === 0) return null;

    const getMedalIcon = (rank) => {
        if (rank === 1) return <span className="medal-icon">🥇</span>;
        if (rank === 2) return <span className="medal-icon">🥈</span>;
        if (rank === 3) return <span className="medal-icon">🥉</span>;
        return <span className="medal-num">#{rank}</span>;
    };

    return (
        <div className="top-purchases-section">
            <h2 className="section-title">Top Purchases</h2>

            <div className="top-purchases-card">
                <div className="top-purchases-list">
                    {topPurchases.map((player) => (
                        <div
                            key={player._id}
                            className="top-purchase-row tr-hover"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedPlayer(player)}
                        >
                            <div className="top-purchase-left">
                                <div className="rank-wrapper">
                                    {getMedalIcon(player.rank)}
                                </div>
                                <div className="player-meta-box">
                                    <div className="player-name">{player.name}</div>
                                    <div className="player-sub-info">
                                        <span className="sold-role font-mono">{player.role}</span>
                                        <span
                                            className="sold-team-badge"
                                            style={{
                                                backgroundColor: player.teamColor || '#3B82F6',
                                                color: getContrastColor(player.teamColor)
                                            }}
                                        >
                                            {player.teamName}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="top-purchase-right font-mono">
                                ₹{player.soldPrice}L
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedPlayer && (
                <BidHistoryModal
                    historyPlayer={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                    teamMap={teamMap || new Map()}
                />
            )}
        </div>
    );
}
