import React, { useState } from 'react';
import { ChevronRight, Trophy, Users, Target, Activity, Shield, UserCheck } from 'lucide-react';
import useTeamsPanel from './hooks/useTeamsPanel';
import TeamDetailModal from './TeamDetailModal';
import './TeamsPanel.css';

const ROLE_ICONS = {
    'BATSMAN': <Target className="w-3 h-3" />,
    'BOWLER': <Activity className="w-3 h-3" />,
    'ALL ROUNDER': <Shield className="w-3 h-3" />,
    'WICKET KEEPER': <UserCheck className="w-3 h-3" />,
    'Batsman': <Target className="w-3 h-3" />,
    'Bowler': <Activity className="w-3 h-3" />,
    'All Rounder': <Shield className="w-3 h-3" />,
    'Wicket Keeper': <UserCheck className="w-3 h-3" />,
    'default': <Users className="w-3 h-3" />
};

export default function TeamsPanel({ teams, players, squadMap, config }) {
    const [selectedTeam, setSelectedTeam] = useState(null);
    const { calculatedTeams } = useTeamsPanel(teams, players, squadMap);

    return (
        <div className="team-grid">
            {calculatedTeams.map((team) => (
                <div
                    key={team._id}
                    onClick={() => setSelectedTeam(team)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedTeam(team)}
                    tabIndex="0"
                    role="button"
                    aria-label={`View details for ${team.name}`}
                    className="card team-card"
                >
                    <div className="team-card__header" style={{ backgroundColor: team.color }}>
                        <h3 className="team-card__title">{team.name}</h3>
                        <div className="team-card__subtitle">
                            {team.squad.length} Players
                            <ChevronRight className="w-4 h-4" />
                        </div>
                        <Trophy className="team-card__trophy-glow" />
                    </div>

                    <div className="team-card__purse-row">
                        <div className="team-card__purse-label">Purse: <span style={{ color: team.remaining < 0 ? 'var(--red-500)' : 'var(--green-500)' }}>₹{team.remaining}L</span></div>
                        <div className="team-card__purse-label">Spent: <span style={{ color: 'var(--blue-500)' }}>₹{team.spent}L</span></div>
                    </div>

                    <div className="team-card__players-list">
                        {team.squad.length === 0 ? (
                            <div className="team-card__players-empty">
                                <Users className="w-6 h-6 mb-2 opacity-50" />
                                Empty Squad
                            </div>
                        ) : (
                            team.squad.map(p => (
                                <div key={p._id} className="team-card__player-row">
                                    <div className="team-card__player-info">
                                        <div className="team-card__player-icon">{ROLE_ICONS[p.role] || ROLE_ICONS['default']}</div>
                                        <div>
                                            <div className="team-card__player-name">{p.name}</div>
                                            <div className="team-card__player-role">{p.role}</div>
                                        </div>
                                    </div>
                                    <div className="team-card__player-price">₹{p.soldPrice}L</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ))}

            {selectedTeam && (
                <TeamDetailModal
                    team={selectedTeam}
                    squad={squadMap.get(selectedTeam._id) || []}
                    config={config}
                    onClose={() => setSelectedTeam(null)}
                />
            )}
        </div>
    );
}
