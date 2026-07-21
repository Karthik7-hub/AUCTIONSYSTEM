import React, { useState } from 'react';
import { Trophy, Shield, Users, Crown, Clock, Edit2, Wallet, TrendingUp, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
import Modal from '@shared/components/Modal';
import './Teams.css';

const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor.charAt(0) !== '#') return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

export default function Teams({
    data,
    config,
    isCompleted,
    navigate,
    addTeam,
    isAddingTeam,
    newTeam,
    setNewTeam,
    handleSaveTeamEdit,
    editTeamData,
    setEditTeamData,
    isEditingSelectedTeam,
    setIsEditingSelectedTeam,
    selectedTeam,
    setSelectedTeam,
    theme
}) {
    const [isModalStatsExpanded, setIsModalStatsExpanded] = useState(true);

    const squad = selectedTeam ? selectedTeam.players.map(playerEntry => {
        const pId = typeof playerEntry === 'object' ? playerEntry._id : playerEntry;
        return data.players.find(x => x._id === pId);
    }).filter(Boolean) : [];

    const realSpent = squad.reduce((total, p) => total + (p.soldPrice || 0), 0);
    const realRemaining = selectedTeam ? (selectedTeam.budget - realSpent) : 0;

    const roleCounts = {};
    squad.forEach(p => {
        if (p.role) {
            const upRole = p.role.toUpperCase();
            roleCounts[upRole] = (roleCounts[upRole] || 0) + 1;
            roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
        }
    });

    return (
        <div className="animate-fade-in teams-setup">
            {/* Creator Sidebar Form */}
            <div className="teams-setup__col-form">
                {isCompleted ? (
                    <div className="teams-setup__form-card teams-setup__archive-card">
                        <Trophy className="w-10 h-10 text-green-600" />
                        <h3 className="teams-setup__archive-title">Tournament Completed</h3>
                        <p className="teams-setup__archive-text">
                            This tournament has been archived. No further auction operations are available.
                        </p>
                    </div>
                ) : (
                    <div className="teams-setup__form-card">
                        <h3 className="teams-setup__form-title">Create New Team</h3>
                        <div className="teams-setup__form">
                            <Input label="Team Title" value={newTeam.name} onChange={e => setNewTeam({ ...newTeam, name: e.target.value })} placeholder="e.g. Mumbai Giants" />
                            <Input label="Logo Initials" value={newTeam.logoText || ''} onChange={e => setNewTeam({ ...newTeam, logoText: e.target.value.toUpperCase().slice(0, 3) })} placeholder="e.g. MI" />
                            <Input label="Purse (₹ Lakhs)" type="number" className="font-mono" value={newTeam.budget} onChange={e => setNewTeam({ ...newTeam, budget: Number(e.target.value) })} />

                            <div className="teams-setup__input-group">
                                <label className="teams-setup__input-label">Theme Color</label>
                                <div className="teams-setup__color-field-row">
                                    <input className="teams-setup__input-field" type="text" value={newTeam.color} onChange={e => setNewTeam({ ...newTeam, color: e.target.value })} style={{ flex: 1 }} />
                                    <input type="color" value={newTeam.color} onChange={e => setNewTeam({ ...newTeam, color: e.target.value })} className="teams-setup__color-input" />
                                </div>
                            </div>
                            <Button onClick={addTeam} loading={isAddingTeam} variant="primary" className="teams-setup__submit-btn">
                                Create Team
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* List Cards Grid */}
            <div className="teams-setup__col-grid">
                <div className="teams-setup__list-card">
                    <h3 className="teams-setup__list-title">Registered Teams ({data.teams.length})</h3>
                    <div className="teams-setup__grid">
                        {data.teams.map(team => {
                            const pursePercent = Math.max(0, Math.min(100, Math.round(((team.budget - team.spent) / team.budget) * 100))) || 0;
                            const spentPercent = Math.max(0, Math.min(100, Math.round((team.spent / team.budget) * 100))) || 0;
                            const totalSlots = 15;
                            const filledSlots = Math.min(team.players.length, totalSlots);
                            const contrastColor = getContrastColor(team.color);
                            const isDarkTheme = contrastColor === '#ffffff';
                            const subTextColor = isDarkTheme ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)';
                            const trackColor = isDarkTheme ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)';
                            const iconBg = isDarkTheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';

                            return (
                                <div
                                    key={team._id}
                                    onClick={() => setSelectedTeam(team)}
                                    className="teams-setup__card"
                                    style={{
                                        backgroundColor: team.color,
                                        color: contrastColor,
                                        borderColor: team.color,
                                        borderWidth: '1px',
                                        boxShadow: `0 8px 24px ${team.color}40`,
                                        background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}E6 100%)`
                                    }}
                                >
                                    <div className="teams-setup__card-header">
                                        <div className="teams-setup__card-left">
                                            <div className="teams-setup__card-avatar" style={{ backgroundColor: iconBg, color: contrastColor }}>
                                                {team.logoText || team.name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase()}
                                            </div>
                                            <div className="teams-setup__card-details">
                                                <h4 className="teams-setup__card-name" style={{ color: contrastColor }}>{team.name}</h4>
                                                <div className="teams-setup__card-role-row">
                                                    <span className="teams-setup__card-role-text" style={{ color: subTextColor }}>Registered Team</span>
                                                    <span className="teams-setup__card-dot" style={{ color: subTextColor }}>•</span>
                                                    <span className="teams-setup__card-purse" style={{ color: contrastColor }}>
                                                        ₹{team.budget - team.spent}L Left
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3 Gauges */}
                                    <div className="teams-setup__stats-row">
                                        {/* Purse Left */}
                                        <div className="teams-setup__stats-col">
                                            <div className="teams-setup__stats-header">
                                                <div className="teams-setup__stats-icon-bg" style={{ backgroundColor: iconBg, color: contrastColor }}>
                                                    <Wallet className="w-3.5 h-3.5" style={{ color: contrastColor }} />
                                                </div>
                                                <span className="teams-setup__stats-label" style={{ color: subTextColor }}>Purse Left</span>
                                            </div>
                                            <div className="font-mono teams-setup__stats-value" style={{ color: contrastColor }}>
                                                ₹{team.budget - team.spent}L
                                            </div>
                                            <span className="teams-setup__stats-max" style={{ color: subTextColor }}>of ₹{team.budget}L</span>

                                            <svg width="70" height="42" viewBox="0 0 70 42" className="teams-setup__stats-gauge">
                                                <path d="M 8 36 A 27 27 0 0 1 62 36" fill="none" stroke={trackColor} strokeWidth="5" strokeLinecap="round" />
                                                <path d="M 8 36 A 27 27 0 0 1 62 36" fill="none" stroke={contrastColor} strokeWidth="5" strokeLinecap="round" strokeDasharray="84.82" strokeDashoffset={84.82 * (1 - pursePercent / 100)} style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
                                                <text x="35" y="34" textAnchor="middle" className="teams-setup__stats-gauge-text" style={{ fill: contrastColor }}>{pursePercent}%</text>
                                            </svg>
                                        </div>

                                        {/* Spent */}
                                        <div className="teams-setup__stats-col teams-setup__stats-col--border" style={{ borderColor: trackColor }}>
                                            <div className="teams-setup__stats-header">
                                                <div className="teams-setup__stats-icon-bg" style={{ backgroundColor: iconBg, color: contrastColor }}>
                                                    <TrendingUp className="w-3.5 h-3.5" style={{ color: contrastColor }} />
                                                </div>
                                                <span className="teams-setup__stats-label" style={{ color: subTextColor }}>Amt Spent</span>
                                            </div>
                                            <div className="font-mono teams-setup__stats-value" style={{ color: contrastColor }}>
                                                ₹{team.spent}L
                                            </div>
                                            <span className="teams-setup__stats-max" style={{ color: subTextColor }}>of ₹{team.budget}L</span>

                                            <svg width="70" height="42" viewBox="0 0 70 42" className="teams-setup__stats-gauge">
                                                <path d="M 8 36 A 27 27 0 0 1 62 36" fill="none" stroke={trackColor} strokeWidth="5" strokeLinecap="round" />
                                                <path d="M 8 36 A 27 27 0 0 1 62 36" fill="none" stroke={contrastColor} strokeWidth="5" strokeLinecap="round" strokeDasharray="84.82" strokeDashoffset={84.82 * (1 - spentPercent / 100)} style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
                                                <text x="35" y="34" textAnchor="middle" className="teams-setup__stats-gauge-text" style={{ fill: contrastColor }}>{spentPercent}%</text>
                                            </svg>
                                        </div>

                                        {/* Slots */}
                                        <div className="teams-setup__stats-col teams-setup__stats-col--border" style={{ borderColor: trackColor }}>
                                            <div className="teams-setup__stats-header">
                                                <div className="teams-setup__stats-icon-bg" style={{ backgroundColor: iconBg, color: contrastColor }}>
                                                    <Users className="w-3.5 h-3.5" style={{ color: contrastColor }} />
                                                </div>
                                                <span className="teams-setup__stats-label" style={{ color: subTextColor }}>Squad Size</span>
                                            </div>
                                            <div className="teams-setup__stats-value" style={{ color: contrastColor }}>
                                                {team.players.length}
                                            </div>
                                            <span className="teams-setup__stats-max" style={{ color: subTextColor }}>of 15 Players</span>

                                            <svg width="70" height="42" viewBox="0 0 70 42" className="teams-setup__stats-gauge">
                                                <path d="M 8 36 A 27 27 0 0 1 62 36" fill="none" stroke={trackColor} strokeWidth="5" strokeLinecap="round" />
                                                <path d="M 8 36 A 27 27 0 0 1 62 36" fill="none" stroke={contrastColor} strokeWidth="5" strokeLinecap="round" strokeDasharray="84.82" strokeDashoffset={84.82 * (1 - (filledSlots / totalSlots))} style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
                                                <text x="35" y="34" textAnchor="middle" className="teams-setup__stats-gauge-text" style={{ fill: contrastColor }}>{Math.round((filledSlots / totalSlots) * 100)}%</text>
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Dots */}
                                    <div className="teams-setup__squad-row">
                                        <span className="teams-setup__squad-label" style={{ color: subTextColor }}>Slots filled</span>
                                        <div className="teams-setup__squad-dots">
                                            {Array.from({ length: totalSlots }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="teams-setup__squad-dot-item"
                                                    style={{
                                                        backgroundColor: i < team.players.length ? contrastColor : trackColor
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer Info & View Squad Link */}
                                    <div className="teams-setup__card-footer" style={{ borderTopColor: trackColor }}>
                                        <div className="teams-setup__card-footer-left" style={{ color: subTextColor }}>
                                            <Clock className="w-3.5 h-3.5" style={{ opacity: 0.8 }} />
                                            <span>Registered Team</span>
                                        </div>
                                        <span className="teams-setup__card-footer-link" style={{ color: contrastColor, fontWeight: '800' }}>
                                            View Team <ArrowRight className="w-3.5 h-3.5" />
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {data.teams.length === 0 && (
                            <div className="empty-table-state" style={{ width: '100%', gridColumn: '1/-1' }}>
                                No teams registered yet. Use the creation form to introduce one.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- TEAM DETAIL MODAL --- */}
            {selectedTeam && (
                <Modal
                    isOpen={!!selectedTeam}
                    onClose={() => { setSelectedTeam(null); setIsEditingSelectedTeam(false); }}
                    maxWidth={isEditingSelectedTeam ? "32rem" : "47.5rem"}
                    bannerColor={selectedTeam.color}
                    className="team-edit-modal-container"
                    theme={theme}
                    title={
                        isEditingSelectedTeam ? (
                            <div className="team-edit-modal__title-row">
                                <Edit2 className="w-5 h-5 text-accent" />
                                <h2 className="team-edit-modal__name">Edit Team Details</h2>
                            </div>
                        ) : (
                            <div className="team-edit-modal__header">
                                <div className="team-edit-modal__header-left">
                                    {(() => {
                                        const initials = selectedTeam.logoText || selectedTeam.name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase();
                                        return (
                                            <div 
                                                className="team-edit-modal__logo"
                                                style={{ '--team-color': selectedTeam.color }}
                                            >
                                                <span className="team-edit-modal__logo-text">{initials}</span>
                                            </div>
                                        );
                                    })()}
                                    <div className="team-edit-modal__details">
                                        <div className="team-edit-modal__title-row">
                                            <h2 className="team-edit-modal__name">{selectedTeam.name}</h2>
                                            {!isCompleted && (
                                                <button
                                                    onClick={() => {
                                                        setEditTeamData({
                                                            name: selectedTeam.name,
                                                            budget: selectedTeam.budget,
                                                            color: selectedTeam.color,
                                                            logoText: selectedTeam.logoText || ''
                                                        });
                                                        setIsEditingSelectedTeam(true);
                                                    }}
                                                    className="team-edit-modal__toggle-stats-btn"
                                                    title="Edit Team Details"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 team-edit-modal__edit-icon" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                >
                    {isEditingSelectedTeam ? (
                        <div className="teams-setup__form team-edit-modal__edit-form">
                            <Input 
                                label="Team Name" 
                                value={editTeamData.name} 
                                onChange={e => setEditTeamData({ ...editTeamData, name: e.target.value })} 
                            />
                            <Input 
                                label="Logo Initials" 
                                value={editTeamData.logoText} 
                                onChange={e => setEditTeamData({ ...editTeamData, logoText: e.target.value.toUpperCase().slice(0, 3) })} 
                                placeholder="e.g. MI"
                            />
                            <Input 
                                label="Purse (₹ Lakhs)" 
                                type="number" 
                                value={editTeamData.budget} 
                                onChange={e => setEditTeamData({ ...editTeamData, budget: Number(e.target.value) })} 
                            />
                            <div className="teams-setup__input-group">
                                <label className="teams-setup__input-label">Theme Color</label>
                                <div className="teams-setup__color-field-row">
                                    <input className="teams-setup__input-field team-edit-modal__color-input-text" type="text" value={editTeamData.color} onChange={e => setEditTeamData({ ...editTeamData, color: e.target.value })} />
                                    <input type="color" value={editTeamData.color} onChange={e => setEditTeamData({ ...editTeamData, color: e.target.value })} className="teams-setup__color-input" />
                                </div>
                            </div>
                            
                            <div className="team-edit-modal__form-actions">
                                <Button onClick={() => setIsEditingSelectedTeam(false)} variant="secondary">Cancel</Button>
                                <Button onClick={handleSaveTeamEdit} variant="primary">Save Changes</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="team-edit-modal__content">
                            {isModalStatsExpanded && (
                                <>
                                    {/* 3-Column Metrics Grid */}
                                    <div className="team-edit-modal__stats-grid">
                                        {/* Card 1: Players */}
                                        {(() => {
                                            const playerPct = Math.round((squad.length / 15) * 100) || 0;
                                            return (
                                                <div className="team-edit-modal__stats-card">
                                                    <div className="team-edit-modal__stats-header-row">
                                                        <div className="teams-setup__stats-icon-bg teams-setup__stats-icon-bg--purse">
                                                            <Users className="w-3.5 h-3.5 team-edit-modal__role-icon--batsman" />
                                                        </div>
                                                        <span className="team-edit-modal__stats-label">Players</span>
                                                    </div>
                                                    <div className="team-edit-modal__stats-value">
                                                        {squad.length} <span className="team-edit-modal__stats-subtext">/ 15</span>
                                                    </div>
                                                    <div className="team-edit-modal__progress-col">
                                                        <div className="progress-bar-bg team-edit-modal__progress-bar">
                                                            <div className="progress-bar-fill team-edit-modal__progress-fill--players" style={{ width: `${Math.min(100, playerPct)}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Card 2: Purse Left */}
                                        {(() => {
                                            const pursePct = Math.round((realRemaining / selectedTeam.budget) * 100) || 0;
                                            return (
                                                <div className="team-edit-modal__stats-card">
                                                    <div className="team-edit-modal__stats-header-row">
                                                        <div className="teams-setup__stats-icon-bg teams-setup__stats-icon-bg--spent">
                                                            <Wallet className="w-3.5 h-3.5 team-edit-modal__role-icon--bowler" />
                                                        </div>
                                                        <span className="team-edit-modal__stats-label">Purse Left</span>
                                                    </div>
                                                    <div className="font-mono team-edit-modal__stats-value team-edit-modal__stats-value--purse">
                                                        ₹{realRemaining}L <span className="team-edit-modal__stats-subtext">/ ₹{selectedTeam.budget}L</span>
                                                    </div>
                                                    <div className="team-edit-modal__progress-col">
                                                        <div className="progress-bar-bg team-edit-modal__progress-bar">
                                                            <div className="progress-bar-fill team-edit-modal__progress-fill--purse" style={{ width: `${Math.min(100, pursePct)}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Card 3: Spent */}
                                        {(() => {
                                            const spentPct = Math.round((realSpent / selectedTeam.budget) * 100) || 0;
                                            return (
                                                <div className="team-edit-modal__stats-card">
                                                    <div className="team-edit-modal__stats-header-row">
                                                        <div className="teams-setup__stats-icon-bg teams-setup__stats-icon-bg--slots">
                                                            <TrendingUp className="w-3.5 h-3.5 team-edit-modal__role-icon--allrounder" />
                                                        </div>
                                                        <span className="team-edit-modal__stats-label">Spent</span>
                                                    </div>
                                                    <div className="font-mono team-edit-modal__stats-value team-edit-modal__stats-value--spent">
                                                        ₹{realSpent}L <span className="team-edit-modal__stats-subtext">({spentPct}%)</span>
                                                    </div>
                                                    <div className="team-edit-modal__progress-col">
                                                        <div className="progress-bar-bg team-edit-modal__progress-bar">
                                                            <div className="progress-bar-fill team-edit-modal__progress-fill--spent" style={{ width: `${Math.min(100, spentPct)}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Squad Composition */}
                                    <div className="team-edit-modal__content-section">
                                        <h3 className="team-edit-modal__subtitle">Squad Composition</h3>
                                        <div className="team-edit-modal__role-list">
                                            {/* Role 1: Batsman */}
                                            {(() => {
                                                const limit = 8;
                                                const count = roleCounts['Batsman'] || 0;
                                                return (
                                                    <div className="team-edit-modal__role-row">
                                                        <div className="team-edit-modal__role-info-header">
                                                            <div className="team-edit-modal__role-title-group">
                                                                <Trophy className="w-3.5 h-3.5 team-edit-modal__role-icon--batsman" />
                                                                <span className="team-edit-modal__role-name">Batsman</span>
                                                            </div>
                                                            <span className="team-edit-modal__role-count">{count}/{limit}</span>
                                                        </div>
                                                        <div className="progress-bar-bg team-edit-modal__progress-bar">
                                                            <div className="progress-bar-fill team-edit-modal__progress-fill--batsman" style={{ width: `${Math.min(100, (count / limit) * 100)}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Role 2: Bowler */}
                                            {(() => {
                                                const limit = 8;
                                                const count = roleCounts['Bowler'] || 0;
                                                return (
                                                    <div className="team-edit-modal__role-row">
                                                        <div className="team-edit-modal__role-info-header">
                                                            <div className="team-edit-modal__role-title-group">
                                                                <Shield className="w-3.5 h-3.5 team-edit-modal__role-icon--bowler" />
                                                                <span className="team-edit-modal__role-name">Bowler</span>
                                                            </div>
                                                            <span className="team-edit-modal__role-count">{count}/{limit}</span>
                                                        </div>
                                                        <div className="progress-bar-bg team-edit-modal__progress-bar">
                                                            <div className="progress-bar-fill team-edit-modal__progress-fill--bowler" style={{ width: `${Math.min(100, (count / limit) * 100)}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Role 3: All Rounder */}
                                            {(() => {
                                                const limit = 8;
                                                const count = roleCounts['All Rounder'] || 0;
                                                return (
                                                    <div className="team-edit-modal__role-row">
                                                        <div className="team-edit-modal__role-info-header">
                                                            <div className="team-edit-modal__role-title-group">
                                                                <TrendingUp className="w-3.5 h-3.5 team-edit-modal__role-icon--allrounder" />
                                                                <span className="team-edit-modal__role-name">All Rounder</span>
                                                            </div>
                                                            <span className="team-edit-modal__role-count">{count}/{limit}</span>
                                                        </div>
                                                        <div className="progress-bar-bg team-edit-modal__progress-bar">
                                                            <div className="progress-bar-fill team-edit-modal__progress-fill--allrounder" style={{ width: `${Math.min(100, (count / limit) * 100)}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Role 4: Wicket Keeper */}
                                            {(() => {
                                                const limit = 2;
                                                const count = roleCounts['Wicket Keeper'] || 0;
                                                return (
                                                    <div className="team-edit-modal__role-row">
                                                        <div className="team-edit-modal__role-info-header">
                                                            <div className="team-edit-modal__role-title-group">
                                                                <Users className="w-3.5 h-3.5 team-edit-modal__role-icon--wktkeeper" />
                                                                <span className="team-edit-modal__role-name">Wkt Keeper</span>
                                                            </div>
                                                            <span className="team-edit-modal__role-count">{count}/{limit}</span>
                                                        </div>
                                                        <div className="progress-bar-bg team-edit-modal__progress-bar">
                                                            <div className="progress-bar-fill team-edit-modal__progress-fill--wktkeeper" style={{ width: `${Math.min(100, (count / limit) * 100)}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Acquired Players List */}
                            <div className="team-edit-modal__squad-section">
                                <div className="team-edit-modal__squad-header">
                                    <span className="team-edit-modal__squad-title">Acquired Players ({squad.length})</span>
                                    <button 
                                        onClick={() => setIsModalStatsExpanded(prev => !prev)}
                                        className="team-edit-modal__toggle-stats-btn"
                                    >
                                        {isModalStatsExpanded ? (
                                            <>Hide Stats <ChevronUp className="w-3.5 h-3.5" /></>
                                        ) : (
                                            <>Show Stats <ChevronDown className="w-3.5 h-3.5" /></>
                                        )}
                                    </button>
                                </div>
                                
                                {squad.length === 0 ? (
                                    <div className="team-edit-modal__empty-state">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                                            <path d="M2 10a10 10 0 0 1 20 0v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
                                            <path d="M6 14v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"/>
                                            <path d="M12 2v8"/>
                                        </svg>
                                        <div className="team-edit-modal__empty-title">No players acquired yet.</div>
                                        <div className="team-edit-modal__empty-subtitle">Players purchased during the auction will appear here.</div>
                                        <Button onClick={() => { navigate(`/auction/${config?.slug}/live`); setSelectedTeam(null); }} variant="primary" className="team-edit-modal__go-live-btn">
                                            Go to Auction
                                        </Button>
                                    </div>
                                ) : (
                                    <div className={`team-edit-modal__squad-list team-edit-modal__squad-list--${isModalStatsExpanded ? 'collapsed' : 'expanded'}`}>
                                        {squad.map((p, idx) => (
                                            <div key={p._id} className="team-edit-modal__player-card">
                                                <div className="team-edit-modal__player-info">
                                                    <div className="team-edit-modal__player-rank">
                                                        #{idx + 1}
                                                    </div>
                                                    <div>
                                                        <span className="team-edit-modal__player-name">{p.name}</span>
                                                        <div className="team-edit-modal__player-meta">
                                                            {p.role} • {p.category}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="team-edit-modal__player-price">₹{p.soldPrice}L</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
