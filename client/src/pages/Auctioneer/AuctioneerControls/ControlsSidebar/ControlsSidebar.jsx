import React, { useState } from 'react';
import { Play, AlertCircle, CheckCircle, Users, ArrowLeft, X } from 'lucide-react';
import Button from '@shared/components/Button';
import Badge from '@shared/components/Badge';
import ConfirmDialog from '@shared/components/ConfirmDialog/ConfirmDialog';
import './ControlsSidebar.css';

export default function ControlsSidebar({
    isSidebarOpen,
    setIsSidebarOpen,
    sidebarTab,
    setSidebarTab,
    queuePlayers,
    categoryOrder,
    groupedQueue,
    setStatusList,
    unsoldPlayers,
    soldPlayers,
    teams,
    isCompleted,
    startPlayer,
    navigate,
    config
}) {
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    return (
        <div className={`sidebar ${isSidebarOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
            {/* Header */}
            <div className="sidebar__header">
                <div className="sidebar__header-title">
                    {sidebarTab === 'teams' ? 'Team Standings' : 'Player Lists'}
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="sidebar__close-btn" title="Close Menu">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* 4-Way Tab Switcher */}
            <div className="sidebar__tabs">
                {[
                    { id: 'queue', icon: Play, label: 'Queue' },
                    { id: 'unsold', icon: AlertCircle, label: 'Unsold' },
                    { id: 'sold', icon: CheckCircle, label: 'Sold' },
                    { id: 'teams', icon: Users, label: 'Teams' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSidebarTab(tab.id)}
                        className={`sidebar__tab-btn ${sidebarTab === tab.id ? 'sidebar__tab-btn--active' : ''}`}
                    >
                        <tab.icon />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Sidebar Content Area */}
            <div className="sidebar__content">

                {/* VIEW: PLAYERS (Queue) */}
                {sidebarTab === 'queue' && (
                    <div className="sidebar__list">
                        {queuePlayers.length === 0 && <div className="sidebar__empty-state">Queue Empty</div>}

                        {categoryOrder.map(category => {
                            const players = groupedQueue[category];
                            if (!players || players.length === 0) return null;

                            const setStatus = setStatusList.statuses[category];

                            return (
                                <div key={category} className="sidebar__category-group animate-slide-in-left">
                                    <div
                                        className={`sidebar__category-side ${setStatus === 'active' ? 'sidebar__category-side--active' : ''} ${setStatus === 'locked' ? 'sidebar__category-side--locked' : ''}`}
                                    >
                                        <span className={`sidebar__category-text ${setStatus === 'active' ? 'sidebar__category-text--active' : ''}`}>
                                            {category} ({players.length})
                                        </span>
                                    </div>

                                    <div className="sidebar__category-list">
                                        {players.map(p => {
                                            const isClickable = !config?.isStrictRandom && setStatus === 'active';
                                            return (
                                                <div
                                                    key={p._id}
                                                    onClick={isClickable ? () => startPlayer(p) : null}
                                                    className={`sidebar__card ${setStatus === 'locked' ? 'sidebar__card--locked' : ''} ${setStatus === 'active' ? 'sidebar__card--active' : ''} ${isClickable ? 'sidebar__card--clickable' : ''}`}
                                                >
                                                    <div className="sidebar__card-row">
                                                        <div className={`sidebar__card-title ${setStatus === 'locked' ? 'sidebar__card-title--locked' : ''}`}>{p.name}</div>
                                                        {setStatus === 'locked' && (
                                                            <span className="sidebar__card-status sidebar__card-status--locked">Locked</span>
                                                        )}
                                                        {setStatus === 'active' && (
                                                            <span className="sidebar__card-status sidebar__card-status--active">
                                                                {config?.isStrictRandom ? 'Draw Pool' : 'Pick Player'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="sidebar__card-sub">
                                                        <Badge variant={setStatus === 'locked' ? 'secondary' : 'primary'}>{p.role}</Badge>
                                                        <span className={`sidebar__card-value ${setStatus === 'locked' ? 'sidebar__card-value--locked' : ''}`}>₹{p.basePrice}L</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* VIEW: UNSOLD */}
                {sidebarTab === 'unsold' && (
                    <div className="sidebar__list">
                        {unsoldPlayers.map(p => {
                            const isUnsoldRound = setStatusList.allCompleted;
                            return (
                                <div
                                    key={p._id}
                                    onClick={isUnsoldRound && !isCompleted ? () => startPlayer(p) : null}
                                    className={`sidebar__card ${isUnsoldRound ? 'sidebar__card--recallable' : 'sidebar__card--locked'}`}
                                >
                                    <div className="sidebar__card-row">
                                        <div className="sidebar__card-title">{p.name}</div>
                                        {!isUnsoldRound && (
                                            <span className="sidebar__card-status sidebar__card-status--locked">Locked</span>
                                        )}
                                        {isUnsoldRound && !isCompleted && (
                                            <span className="sidebar__card-status sidebar__card-status--recall">Recall</span>
                                        )}
                                    </div>
                                    <div className="sidebar__card-sub">
                                        <Badge variant={isUnsoldRound ? 'danger' : 'secondary'}>{p.role}</Badge>
                                        <span className="sidebar__card-value">₹{p.basePrice}L</span>
                                    </div>
                                </div>
                            );
                        })}
                        {unsoldPlayers.length === 0 && <div className="sidebar__empty-state">No Unsold Players</div>}
                    </div>
                )}

                {/* VIEW: SOLD */}
                {sidebarTab === 'sold' && (
                    <div className="sidebar__list">
                        {soldPlayers.map(p => (
                            <div key={p._id} className="sidebar__card sidebar__card--sold">
                                <div className="sidebar__card-title">{p.name}</div>
                                <div className="sidebar__card-sub" style={{ alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>{teams.find(t => t._id === p.soldTo)?.name}</span>
                                    <Badge variant="success">₹{p.soldPrice}L</Badge>
                                </div>
                            </div>
                        ))}
                        {soldPlayers.length === 0 && <div className="sidebar__empty-state">No Players Sold Yet</div>}
                    </div>
                )}

                {/* VIEW: TEAMS DETAIL */}
                {sidebarTab === 'teams' && (
                    <div className="sidebar__list">
                        {teams.map(team => {
                            const percentUsed = (team.spent / team.budget) * 100;
                            return (
                                <div key={team._id} className="sidebar__card">
                                    <div className="sidebar__card-row" style={{ marginBottom: 'var(--sp-2)' }}>
                                        <span className="sidebar__card-title">{team.name}</span>
                                        <Badge variant="info">{team.players.length} Players</Badge>
                                    </div>

                                    <div className="sidebar__team-progress">
                                        <div className="sidebar__team-progress-info">
                                            <span>Used: ₹{team.spent}L</span>
                                            <span>Total: ₹{team.budget}L</span>
                                        </div>
                                        <div className="progress-bar-bg" style={{ height: '6px' }}>
                                            <div
                                                className="progress-bar-fill"
                                                style={{ width: `${percentUsed}%`, backgroundColor: team.color }}
                                            ></div>
                                        </div>
                                        <div className="sidebar__team-progress-remaining">
                                            Rem: ₹{team.budget - team.spent}L
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom Footer / Exit */}
            <div className="sidebar__footer">
                <Button onClick={() => setShowExitConfirm(true)} variant="secondary" className="sidebar__exit-btn">
                    <ArrowLeft className="w-4 h-4" /> Return to Dashboard
                </Button>
            </div>

            {/* Confirmation Dialog for Exit */}
            <ConfirmDialog
                isOpen={showExitConfirm}
                onClose={() => setShowExitConfirm(false)}
                onConfirm={() => navigate(`/auction/${config?.slug}/setup`)}
                title="Return to Setup Dashboard?"
                message="Are you sure you want to exit the live auction control screen and return to the setup dashboard?"
                confirmText="Return to Dashboard"
                cancelText="Cancel"
                type="warning"
            />
        </div>
    );
}
