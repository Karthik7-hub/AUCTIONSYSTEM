import React, { useState } from 'react';
import { Download } from 'lucide-react';
import TeamDetailModal from '../../../TeamsPanel/TeamDetailModal';
import './TeamPerformance.css';

const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.charAt(0) !== '#') return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

const getTeamInitials = (name, logoText) => {
    if (logoText && logoText.trim()) return logoText.trim();
    if (!name) return '';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 3);
};

export default function TeamPerformanceTable({ teams, auctionId, onPrintTeam, squadMap }) {
    const [selectedTeam, setSelectedTeam] = useState(null);

    if (!teams || teams.length === 0) return null;

    return (
        <div className="teams-performance-section">
            <div className="teams-section-header">
                <h2 className="section-title">Team Performance</h2>
                <button
                    className="teams-pdf-btn"
                    onClick={() => onPrintTeam && onPrintTeam()}
                    title="Download all team squads as PDF"
                >
                    <Download size={15} />
                    All Teams PDF
                </button>
            </div>

            <div className="teams-card">
                <div className="teams-list">
                    {teams.map(team => (
                        <div
                            key={team._id}
                            className="team-row"
                            onClick={() => setSelectedTeam(team)}
                        >
                            <div className="team-left">
                                <div
                                    className="team-logo"
                                    style={{
                                        backgroundColor: team.color || '#3B82F6',
                                        color: getContrastColor(team.color)
                                    }}
                                >
                                    {getTeamInitials(team.name, team.logoText)}
                                </div>
                                <div>
                                    <div className="team-title">{team.name}</div>
                                    <div className="team-sub">{team.squadCount} Players</div>
                                </div>
                            </div>

                            <div className="team-mid">
                                <div className="bar-bg">
                                    <div
                                        className="bar-fill"
                                        style={{ width: `${team.utilization}%`, backgroundColor: team.color }}
                                    ></div>
                                </div>
                            </div>

                            <div className="team-right font-mono">
                                <span className="rem-val">₹{team.remaining}L Rem</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reused Team Detail Modal from Teams Panel */}
            {selectedTeam && (
                <TeamDetailModal
                    team={selectedTeam}
                    squad={squadMap ? squadMap.get(selectedTeam._id) : null}
                    auctionId={auctionId}
                    onClose={() => setSelectedTeam(null)}
                />
            )}
        </div>
    );
}
