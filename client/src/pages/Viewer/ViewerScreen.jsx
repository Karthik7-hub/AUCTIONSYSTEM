import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, Users, List, Gavel, DollarSign } from 'lucide-react';
import Loader from '@shared/components/Loader';

import ResultsPanel from './ResultsPanel';
import LiveAuctionPanel from './LiveAuctionPanel';
import TeamsPanel from './TeamsPanel';
import PlayersPanel from './PlayersPanel';
import ActivityPanel from './ActivityPanel';
import './ViewerScreen.css';

function NavButton({ active, onClick, icon: Icon, label, isLive }) {
    return (
        <button 
            onClick={onClick} 
            className={`viewer__nav-btn ${active ? 'viewer__nav-btn--active' : ''}`}
        >
            <Icon className={`w-4 h-4 ${isLive ? 'text-red-500 animate-pulse' : ''}`} style={{ marginRight: 'var(--sp-2)' }} />
            {label}
            {isLive && <span className="viewer__live-dot" style={{ marginLeft: 'var(--sp-2)' }} />}
        </button>
    );
}

function MobileNavButton({ active, onClick, icon: Icon, label, isLive }) {
    return (
        <button 
            onClick={onClick} 
            className={`viewer__mobile-nav-btn ${active ? 'viewer__mobile-nav-btn--active' : ''}`}
        >
            <div className="viewer__mobile-nav-icon-wrapper">
                <Icon className={`w-5 h-5 ${isLive ? 'text-red-500 animate-pulse' : ''}`} />
                {isLive && <span className="viewer__mobile-nav-badge" />}
            </div>
            <span className="viewer__mobile-nav-label">{label}</span>
        </button>
    );
}

export default function ViewerScreen({ data, liveState, auctionId, config }) {
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = searchParams.get('tab') || 'live';
    const setActiveTab = (tab) => setSearchParams({ tab }, { replace: true });

    // --- ⚡ PERFORMANCE: MEMOIZED LOOKUPS (O(1) Access) ---
    const safePlayers = useMemo(() => data?.players || [], [data?.players]);
    const safeTeams = useMemo(() => data?.teams || [], [data?.teams]);

    const playerMap = useMemo(() =>
        new Map(safePlayers.map(p => [p._id, p])),
        [safePlayers]);

    const teamMap = useMemo(() =>
        new Map(safeTeams.map(t => [t._id, t])),
        [safeTeams]);

    // Pre-calculate squads to avoid filtering on every render
    const squadMap = useMemo(() => {
        const map = new Map();
        safeTeams.forEach(team => {
            const squad = (team.players || []).map(entry => {
                const id = typeof entry === 'object' ? entry._id : entry;
                return playerMap.get(id);
            }).filter(Boolean);
            map.set(team._id, squad);
        });
        return map;
    }, [safeTeams, playerMap]);

    if (!data || !data.players) return (
        <Loader message="Loading Resources..." fullScreen />
    );

    const isCompleted = config?.status === 'completed' || config?.isActive === false;

    return (
        <div className="viewer theme-dark">

            {/* DESKTOP HEADER */}
            <header className="viewer__header md-block hidden">
                <div className="viewer__header-content">
                    <nav className="viewer__desktop-nav">
                        <NavButton 
                            active={activeTab === 'live'} 
                            onClick={() => setActiveTab('live')} 
                            icon={isCompleted ? Trophy : Gavel} 
                            label={isCompleted ? "Tournament Results" : "Live Auction"} 
                            isLive={!isCompleted && liveState?.status === 'ACTIVE'} 
                        />
                        <NavButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={Users} label="Teams" />
                        <NavButton active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={List} label="Players" />
                        <NavButton active={activeTab === 'sold'} onClick={() => setActiveTab('sold')} icon={DollarSign} label="Feed" />
                    </nav>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className={`viewer__main ${activeTab === 'live' && !isCompleted ? 'viewer__main--live-active' : ''}`}>
                <div className="container viewer__container">

                    {activeTab === 'live' && (
                        isCompleted ? (
                            <ResultsPanel
                                auctionId={auctionId}
                                teams={safeTeams}
                                players={safePlayers}
                                squadMap={squadMap}
                                teamMap={teamMap}
                            />
                        ) : (
                            <LiveAuctionPanel
                                liveState={liveState}
                                playerMap={playerMap}
                                teamMap={teamMap}
                            />
                        )
                    )}

                    {activeTab === 'teams' && (
                        <TeamsPanel
                            teams={safeTeams}
                            players={safePlayers}
                            squadMap={squadMap}
                            config={config}
                        />
                    )}

                    {activeTab === 'players' && (
                        <PlayersPanel
                            players={safePlayers}
                            config={config}
                            teamMap={teamMap}
                        />
                    )}

                    {activeTab === 'sold' && (
                        <ActivityPanel
                            players={safePlayers}
                            teamMap={teamMap}
                        />
                    )}

                </div>
            </main>

            {/* === MOBILE BOTTOM NAV === */}
            <div className="viewer__mobile-nav">
                <MobileNavButton 
                    active={activeTab === 'live'} 
                    onClick={() => setActiveTab('live')} 
                    icon={isCompleted ? Trophy : Gavel} 
                    label={isCompleted ? "Results" : "Live"} 
                    isLive={!isCompleted && liveState?.status === 'ACTIVE'} 
                />
                <MobileNavButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={Users} label="Teams" />
                <MobileNavButton active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={List} label="Pool" />
                <MobileNavButton active={activeTab === 'sold'} onClick={() => setActiveTab('sold')} icon={DollarSign} label="Sold" />
            </div>

        </div>
    );
}
