import React, { useState, useMemo } from 'react';
import { Trophy, ChevronUp, ChevronDown, Users, Target, Activity, Shield, UserCheck } from 'lucide-react';
import Modal from '@shared/components/Modal';
import './TeamDetailModal.css';

const ROLE_ICONS = {
    'Batsman': <Target className="w-3 h-3" />,
    'Bowler': <Activity className="w-3 h-3" />,
    'All Rounder': <Shield className="w-3 h-3" />,
    'Wicket Keeper': <UserCheck className="w-3 h-3" />,
    'default': <Users className="w-3 h-3" />
};

export default function TeamDetailModal({ team, squad, config, onClose }) {
    const [isStatsExpanded, setIsStatsExpanded] = useState(true);

    const realSpent = useMemo(() => squad.reduce((total, p) => total + (p.soldPrice || 0), 0), [squad]);
    const realRemaining = team.budget - realSpent;

    // Define configured roles in uppercase
    const configuredRoles = useMemo(() => {
        if (config?.roles?.length) {
            return config.roles.map(r => r.toUpperCase());
        }
        return ['BATSMAN', 'BOWLER', 'ALL ROUNDER', 'WICKET KEEPER'];
    }, [config]);

    // Build role display labels preserving casing
    const roleLabels = useMemo(() => {
        const labels = {};
        configuredRoles.forEach(r => {
            const orig = config?.roles?.find(cr => cr.toUpperCase() === r);
            labels[r] = orig || r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
        });
        return labels;
    }, [configuredRoles, config]);

    const composition = useMemo(() => {
        const counts = {};
        configuredRoles.forEach(r => {
            counts[r] = 0;
        });

        squad.forEach(p => {
            if (p.role) {
                const key = p.role.toUpperCase();
                if (counts[key] === undefined) {
                    counts[key] = 0;
                }
                counts[key]++;
            }
        });
        return counts;
    }, [squad, configuredRoles]);

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            maxWidth="32rem"
            bannerColor={team.color}
            forceTheme="dark"
            title={
                <div className="team-modal__title-row">
                    <div className="team-modal__title-icon-wrapper">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="team-modal__title">{team.name}</h2>
                        <div className="team-modal__subtitle">Team Overview</div>
                    </div>
                </div>
            }
        >
            <div className="team-modal__content">
                
                {/* Collapsible Top Stats Section */}
                {isStatsExpanded && (
                    <div className="team-modal__content animate-fade-in" style={{ padding: 0 }}>
                        {/* Stats Row */}
                        <div className="team-modal__stats-grid">
                            <div className="team-modal__stats-card">
                                <div className="team-modal__stats-label">Players</div>
                                <div className="team-modal__stats-value">{squad.length}</div>
                            </div>
                            <div className="team-modal__stats-card">
                                <div className="team-modal__stats-label">Purse Left</div>
                                <div className="team-modal__stats-value font-mono" style={{ color: realRemaining < 0 ? 'var(--danger)' : 'var(--success)' }}>
                                    ₹{realRemaining}L
                                </div>
                            </div>
                            <div className="team-modal__stats-card">
                                <div className="team-modal__stats-label">Spent</div>
                                <div className="team-modal__stats-value font-mono" style={{ color: 'var(--accent-light)' }}>₹{realSpent}L</div>
                            </div>
                        </div>

                        {/* Composition progress bars */}
                        <div className="team-modal__progress-grid">
                            {Object.entries(composition).map(([role, count]) => {
                                const colorMap = { 'BATSMAN': 'var(--blue-500)', 'BOWLER': 'var(--green-500)', 'ALL ROUNDER': 'var(--purple-500)', 'WICKET KEEPER': 'var(--yellow-500)' };
                                const limitMap = { 'BATSMAN': 8, 'BOWLER': 8, 'ALL ROUNDER': 8, 'WICKET KEEPER': 2 };
                                const limit = limitMap[role] || 8;
                                const displayLabel = roleLabels[role] || role;
                                return (
                                    <div key={role} className="team-modal__progress-col">
                                        <div className="team-modal__progress-header">
                                            <span style={{ color: 'var(--text-muted)' }}>{displayLabel}</span>
                                            <span>{count} / {limit}</span>
                                        </div>
                                        <div className="progress-bar-bg team-modal__progress-bar">
                                            <div className="progress-bar-fill" style={{ width: `${Math.min(100, (count / limit) * 100)}%`, backgroundColor: colorMap[role] || 'var(--slate-500)' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Squad List */}
                <div className="team-modal__squad-section">
                    <div className="team-modal__squad-header">
                        <span>Acquired Players ({squad.length})</span>
                        <button 
                            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                            className="team-modal__toggle-stats-btn"
                        >
                            {isStatsExpanded ? (
                                <>Hide Stats <ChevronUp className="w-3.5 h-3.5" /></>
                            ) : (
                                <>Show Stats <ChevronDown className="w-3.5 h-3.5" /></>
                            )}
                        </button>
                    </div>
                    {squad.length === 0 ? (
                        <div className="team-modal__empty-state">
                            <Users className="w-6 h-6 mb-2 opacity-50" />
                            <div className="team-modal__empty-title">No players acquired yet.</div>
                            <div className="team-modal__empty-subtitle">Players purchased during the auction will appear here.</div>
                        </div>
                    ) : (
                        <div className="team-modal__squad-list" style={{ maxHeight: isStatsExpanded ? '380px' : '580px' }}>
                            {squad.map((p, idx) => (
                                <div key={p._id} className="team-modal__player-card tr-hover">
                                    <div className="team-modal__player-row">
                                        <div className="team-modal__player-info">
                                            <span className="team-modal__player-rank">#{idx + 1}</span>
                                            <span className="team-modal__player-name">{p.name}</span>
                                        </div>
                                        <span className="team-modal__player-price">₹{p.soldPrice}L</span>
                                    </div>
                                    <div className="team-modal__player-meta">
                                        {p.role} • {p.category}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </Modal>
    );
}
